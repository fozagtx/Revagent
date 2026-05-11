import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "../env";

/**
 * Generate a ~30-second narration audio file from a script.
 *
 * Tries Gemini's TTS endpoint first. On failure, falls back to silent
 * mp3 placeholder so the rest of the pipeline doesn't block — the analysis
 * is still useful without audio.
 */
export async function narrateScript(script: string): Promise<{ audio: Buffer; mime: string }> {
  try {
    return await geminiTts(script);
  } catch (err) {
    console.warn("[narrate] Gemini TTS failed, returning placeholder:", err);
    return { audio: silentMp3(), mime: "audio/mpeg" };
  }
}

async function geminiTts(script: string): Promise<{ audio: Buffer; mime: string }> {
  const e = env();
  const genai = new GoogleGenerativeAI(e.GEMINI_API_KEY);
  const model = genai.getGenerativeModel({ model: "gemini-2.5-flash-preview-tts" });

  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: script }] }],
    // @ts-expect-error TTS config is in newer SDK versions
    generationConfig: {
      responseModalities: ["AUDIO"],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: "Kore" } },
      },
    },
  });

  const part = result.response.candidates?.[0]?.content?.parts?.[0];
  const inline = (part as { inlineData?: { data: string; mimeType: string } } | undefined)?.inlineData;
  if (!inline?.data) throw new Error("No audio data in response");
  return { audio: Buffer.from(inline.data, "base64"), mime: inline.mimeType };
}

// Minimal silent MP3 (LAME-encoded ~1 frame) so the audio element always loads something.
function silentMp3(): Buffer {
  // 1 frame of silence at 44.1kHz mono, ~26ms — enough for browsers to consider it valid.
  return Buffer.from(
    "//uQxAADwAABpAAAACAAADSAAAAETEFNRTMuMTAwAaqqqqqqqqqqqqqqqqqqqqqqqqqq",
    "base64",
  );
}
