/**
 * Browser microphone → PCM s16le @ 16kHz chunks via Web Audio API.
 * Returns a stop() handle. Each chunk is sent to the WebSocket as it's emitted.
 */
export interface MicCapture {
  stop: () => void;
}

const TARGET_SAMPLE_RATE = 16000;
const CHUNK_DURATION_MS = 250;

export async function startMicCapture(onChunk: (chunk: ArrayBuffer) => void): Promise<MicCapture> {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: { echoCancellation: true, noiseSuppression: true, channelCount: 1 },
  });
  const audioCtx = new AudioContext({ sampleRate: TARGET_SAMPLE_RATE });
  const source = audioCtx.createMediaStreamSource(stream);
  // createScriptProcessor requires a power of 2 in [256, 16384].
  // 16000 Hz × 250 ms = 4000 samples → round up to 4096 (~256 ms).
  const target = audioCtx.sampleRate * (CHUNK_DURATION_MS / 1000);
  const pow2 = 2 ** Math.ceil(Math.log2(target));
  const bufferSize = Math.min(16384, Math.max(256, pow2));
  const processor = audioCtx.createScriptProcessor(bufferSize, 1, 1);

  processor.onaudioprocess = (e) => {
    const input = e.inputBuffer.getChannelData(0);
    const out = new Int16Array(input.length);
    for (let i = 0; i < input.length; i++) {
      const v = Math.max(-1, Math.min(1, input[i] ?? 0));
      out[i] = v < 0 ? v * 0x8000 : v * 0x7fff;
    }
    onChunk(out.buffer);
  };

  source.connect(processor);
  processor.connect(audioCtx.destination);

  return {
    stop: () => {
      try { processor.disconnect(); } catch { /* */ }
      try { source.disconnect(); } catch { /* */ }
      stream.getTracks().forEach((t) => t.stop());
      void audioCtx.close();
    },
  };
}
