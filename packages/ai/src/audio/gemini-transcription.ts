import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage } from "langchain";
import type { AudioBuffer } from "../@types/audio";
import { AudioUtils } from "../utils/audio-utils";
import type { GeminiTranscriptionOptions } from "./types";

const DEFAULT_GEMINI_TRANSCRIBE_PROMPT =
  "Transcreva o áudio a seguir em texto. Se possível, inclua timestamps aproximados no formato [mm:ss]. Responda apenas com a transcrição.";

export async function transcribeWithGeminiPrompt(
  audioBuffer: AudioBuffer,
  options: GeminiTranscriptionOptions = {},
): Promise<string> {
  const apiKey = options.googleGeminiToken;
  if (!apiKey) {
    throw new Error(
      "googleGeminiToken é obrigatório para transcribeWithGeminiPrompt.",
    );
  }

  const model = new ChatGoogleGenerativeAI({
    model: options.model ?? "gemini-2.5-flash",
    apiKey,
  });

  const base64Data = AudioUtils.bufferToBase64(audioBuffer);
  const mimeType = AudioUtils.detectAudioMimeType(audioBuffer);

  const message = new HumanMessage({
    content: [
      {
        type: "text",
        text: options.prompt ?? DEFAULT_GEMINI_TRANSCRIBE_PROMPT,
      },
      {
        type: "audio",
        source_type: "base64",
        data: base64Data,
        mime_type: mimeType,
      },
    ] as any,
  } as any);

  const response = await model.invoke([message]);
  const content = response.content;
  return typeof content === "string" ? content : JSON.stringify(content);
}
