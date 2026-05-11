import type { Server, ServerWebSocket } from "bun";
import { eq } from "drizzle-orm";
import { getDb, calls } from "@revagent/db";
import type { SwitchChart, TranscriptUtterance, WsSignal, Quadrant } from "@revagent/shared";
import { getSpeechmaticsRtToken, buildStartRecognitionMessage } from "./speechmatics";
import { decodeWindow } from "./jtbd-decoder";
import { maybeNudge } from "./nudge";
import { env } from "../env";

interface SessionState {
  callId: string;
  startedAt: number;
  speechmaticsSocket: WebSocket | null;
  speechmaticsSessionId: string | null;
  speechmaticsReady: boolean;
  audioBuffer: ArrayBuffer[];
  transcript: TranscriptUtterance[];
  switchChart: SwitchChart;
  emittedQuotes: Set<string>;
  alreadyNudgedQuadrants: Set<Quadrant>;
  decodeTimer: ReturnType<typeof setInterval> | null;
  nudgeTimer: ReturnType<typeof setInterval> | null;
}

const sessions = new WeakMap<ServerWebSocket<unknown>, SessionState>();

export function handleCallStreamUpgrade(req: Request, server: Server, callId: string): Response | undefined {
  const success = server.upgrade(req, {
    data: {
      onOpen: () => { /* set by start() below */ },
      onMessage: () => {},
      onClose: () => {},
      _callId: callId,
    },
  });
  if (!success) return new Response("Failed to upgrade", { status: 426 });
  return undefined;
}

// Bun’s upgrade pattern: the WebSocket handler is set globally on Bun.serve.
// We wire the per-session logic via `data` callbacks that the global handler invokes.
// To make this work without changing the global handler, we attach handlers
// using a small queue keyed by callId.
const pendingHandlers = new Map<string, (ws: ServerWebSocket<unknown>) => SessionState>();

// Hook the global handler into the per-session state on first message.
// (Bun’s websocket.open is invoked synchronously with the upgraded ws.)
export function attachOnOpen(callId: string, factory: (ws: ServerWebSocket<unknown>) => SessionState) {
  pendingHandlers.set(callId, factory);
}

// The Bun.serve websocket handler in index.ts dispatches via data callbacks.
// We replace those callbacks here as soon as a socket opens, by reading the
// callId we stored in data and rebuilding state.
export function bindWebSocketLifecycle(ws: ServerWebSocket<{ _callId: string } & Record<string, unknown>>) {
  const callId = ws.data._callId;
  const state: SessionState = {
    callId,
    startedAt: Date.now(),
    speechmaticsSocket: null,
    speechmaticsSessionId: null,
    speechmaticsReady: false,
    audioBuffer: [],
    transcript: [],
    switchChart: { push: [], pull: [], anxiety: [], habit: [] },
    emittedQuotes: new Set(),
    alreadyNudgedQuadrants: new Set(),
    decodeTimer: null,
    nudgeTimer: null,
  };
  sessions.set(ws as unknown as ServerWebSocket<unknown>, state);

  void startSpeechmaticsRelay(ws, state).catch((err) => {
    send(ws, { type: "error", message: err instanceof Error ? err.message : String(err) });
    ws.close(1011, "speechmatics-init-failed");
  });

  state.decodeTimer = setInterval(() => void runDecode(ws, state), 5000);
  state.nudgeTimer = setInterval(() => void runNudge(ws, state), 15000);
}

export function onWsMessage(ws: ServerWebSocket<unknown>, message: string | Buffer) {
  const state = sessions.get(ws);
  if (!state) return;

  if (typeof message === "string") {
    try {
      const msg = JSON.parse(message);
      if (msg.type === "stop") ws.close(1000, "client-stop");
    } catch { /* ignore */ }
    return;
  }
  // Binary frame: raw PCM s16le @ 16kHz from the browser MediaRecorder pipeline.
  if (state.speechmaticsReady && state.speechmaticsSocket?.readyState === WebSocket.OPEN) {
    state.speechmaticsSocket.send(message);
  } else {
    state.audioBuffer.push(message.buffer.slice(message.byteOffset, message.byteOffset + message.byteLength));
  }
}

export function onWsClose(ws: ServerWebSocket<unknown>) {
  const state = sessions.get(ws);
  if (!state) return;
  if (state.decodeTimer) clearInterval(state.decodeTimer);
  if (state.nudgeTimer) clearInterval(state.nudgeTimer);
  try { state.speechmaticsSocket?.close(); } catch { /* */ }

  // Persist transcript + switch chart on the call row.
  void persistCallSnapshot(state).catch((err) => console.error("[call persist]", err));
  sessions.delete(ws);
}

async function startSpeechmaticsRelay(ws: ServerWebSocket<unknown>, state: SessionState) {
  const e = env();
  const token = await getSpeechmaticsRtToken();
  const url = `${e.SPEECHMATICS_RT_URL}/en?jwt=${encodeURIComponent(token)}`;
  const sm = new WebSocket(url);
  state.speechmaticsSocket = sm;

  sm.addEventListener("open", () => {
    sm.send(JSON.stringify(buildStartRecognitionMessage({
      sampleRate: 16000,
      language: "en",
      diarization: true,
      enablePartials: true,
    })));
  });

  sm.addEventListener("message", (event) => {
    try {
      const data = JSON.parse(event.data as string) as { message: string; [k: string]: unknown };
      switch (data.message) {
        case "RecognitionStarted": {
          state.speechmaticsReady = true;
          state.speechmaticsSessionId = (data as { id?: string }).id ?? null;
          // Flush any buffered audio.
          for (const chunk of state.audioBuffer) sm.send(chunk);
          state.audioBuffer = [];
          send(ws, {
            type: "status",
            speechmatics_session_id: state.speechmaticsSessionId,
            connected: true,
          });
          break;
        }
        case "AddTranscript":
        case "AddPartialTranscript": {
          const partial = data.message === "AddPartialTranscript";
          const results = (data as { results?: Array<{ alternatives?: Array<{ content: string; speaker?: string }>; start_time: number; end_time: number }> }).results ?? [];
          const text = results.map((r) => r.alternatives?.[0]?.content ?? "").join(" ").trim();
          if (!text) break;
          const speaker = results[0]?.alternatives?.[0]?.speaker ?? "S1";
          const utt: TranscriptUtterance = {
            speaker,
            text,
            ts_start: results[0]?.start_time ?? 0,
            ts_end: results[results.length - 1]?.end_time ?? 0,
          };
          if (!partial) state.transcript.push(utt);
          send(ws, { type: "transcript", utterance: utt, partial });
          break;
        }
        case "Error":
          send(ws, { type: "error", message: JSON.stringify(data) });
          break;
      }
    } catch (err) {
      console.error("[speechmatics msg]", err);
    }
  });

  sm.addEventListener("close", () => {
    state.speechmaticsReady = false;
    send(ws, { type: "status", speechmatics_session_id: state.speechmaticsSessionId, connected: false });
  });
}

async function runDecode(ws: ServerWebSocket<unknown>, state: SessionState) {
  // Decode the last ~8 utterances.
  const window = state.transcript.slice(-8);
  if (window.length === 0) return;
  try {
    const signals = await decodeWindow(window, state.emittedQuotes);
    for (const s of signals) {
      state.switchChart[s.quadrant].push(s.evidence);
      send(ws, { type: "signal", quadrant: s.quadrant, evidence: s.evidence });
    }
  } catch (err) {
    console.warn("[jtbd decode]", err);
  }
}

function runNudge(ws: ServerWebSocket<unknown>, state: SessionState) {
  const nudge = maybeNudge({
    callStartedAt: state.startedAt,
    switchChart: state.switchChart,
    alreadyNudged: state.alreadyNudgedQuadrants,
    askedProbes: [],
  });
  if (nudge) send(ws, { type: "nudge", ...nudge });
}

async function persistCallSnapshot(state: SessionState) {
  const db = getDb();
  const endedAt = new Date();
  const durationSec = Math.round((endedAt.getTime() - state.startedAt) / 1000);
  await db.update(calls).set({
    endedAt,
    durationSec,
    transcript: state.transcript,
    switchChart: state.switchChart,
    speechmaticsSessionId: state.speechmaticsSessionId,
  }).where(eq(calls.id, state.callId));
}

function send(ws: ServerWebSocket<unknown>, msg: WsSignal) {
  try { ws.send(JSON.stringify(msg)); } catch { /* */ }
}
