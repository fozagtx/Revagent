import { env } from "../env";

/**
 * Fetch a short-lived JWT to authenticate the RT WebSocket.
 * Speechmatics Real-Time API requires a temporary key minted via REST.
 */
export async function getSpeechmaticsRtToken(): Promise<string> {
  const e = env();
  const r = await fetch("https://mp.speechmatics.com/v1/api_keys?type=rt", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${e.SPEECHMATICS_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ttl: 3600 }),
  });
  if (!r.ok) throw new Error(`Speechmatics RT token fetch failed: ${r.status} ${await r.text()}`);
  const json = await r.json() as { key_value?: string };
  if (!json.key_value) throw new Error("No key_value in Speechmatics RT token response");
  return json.key_value;
}

export interface SpeechmaticsStartConfig {
  sampleRate: number;
  language: string;
  diarization: boolean;
  enablePartials: boolean;
}

export function buildStartRecognitionMessage(cfg: SpeechmaticsStartConfig) {
  return {
    message: "StartRecognition",
    audio_format: {
      type: "raw",
      encoding: "pcm_s16le",
      sample_rate: cfg.sampleRate,
    },
    transcription_config: {
      language: cfg.language,
      operating_point: "enhanced",
      diarization: cfg.diarization ? "speaker" : "none",
      enable_partials: cfg.enablePartials,
      max_delay: 2,
    },
  };
}
