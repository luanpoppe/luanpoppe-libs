import type { AudioBuffer } from "../@types/audio";
import { resolveOpenRouterProvider } from "../langchain/models";
import type {
  OpenRouterTranscriptionOptions,
  OpenRouterTranscriptionResult,
} from "./types";
import { bufferToBase64, getAudioExtension } from "./utils";

const OPENROUTER_TRANSCRIPTIONS_URL =
  "https://openrouter.ai/api/v1/audio/transcriptions";

export async function transcribeOpenRouter(
  audioBuffer: AudioBuffer,
  options: OpenRouterTranscriptionOptions,
  openRouterApiKey?: string,
): Promise<OpenRouterTranscriptionResult> {
  if (!openRouterApiKey) {
    throw new Error(
      "OpenRouter API key is not passed in the transcription parameters",
    );
  }

  const format = getAudioExtension(options.format);
  const provider = resolveOpenRouterProvider(options.model, {
    openRouterProvider: options.openRouterProvider,
    openRouterAllowAllProviders: options.openRouterAllowAllProviders,
  });

  const body: Record<string, unknown> = {
    model: options.model,
    input_audio: {
      data: bufferToBase64(audioBuffer),
      format,
    },
  };

  if (options.language) body.language = options.language;
  if (options.temperature !== undefined) body.temperature = options.temperature;
  if (provider) body.provider = provider;

  const response = await fetch(OPENROUTER_TRANSCRIPTIONS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${openRouterApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(
      `[@luanpoppe/ai] OpenRouter STT falhou (${response.status}): ${errText}`,
    );
  }

  const data = (await response.json()) as OpenRouterTranscriptionResult;
  return data;
}
