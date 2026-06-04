import type { OpenRouterSpeechOptions, SpeechResult } from "./types";
import { createOpenRouterOpenAIClient } from "./openrouter-client";
import { resolveOpenRouterProvider } from "../langchain/models";

const CONTENT_TYPE_BY_FORMAT: Record<string, string> = {
  mp3: "audio/mpeg",
  pcm: "audio/pcm",
};

function isGeminiTtsModel(model: string): boolean {
  return /gemini/i.test(model) && /tts/i.test(model);
}

function resolveOpenRouterSpeechFormat(
  model: string,
  responseFormat?: OpenRouterSpeechOptions["responseFormat"],
): "mp3" | "pcm" {
  if (responseFormat) return responseFormat;
  // Gemini TTS no OpenRouter aceita apenas pcm (ver docs OR /audio/speech)
  if (isGeminiTtsModel(model)) return "pcm";
  return "mp3";
}

function validateOpenRouterSpeechOptions(options: OpenRouterSpeechOptions): void {
  if (!options.model) {
    throw new Error("[@luanpoppe/ai] model é obrigatório para speakOpenRouter.");
  }
  if (!options.voice) {
    throw new Error("[@luanpoppe/ai] voice é obrigatório para speakOpenRouter.");
  }
}

export async function speakOpenRouter(
  text: string,
  options: OpenRouterSpeechOptions,
  openRouterApiKey?: string,
): Promise<SpeechResult> {
  validateOpenRouterSpeechOptions(options);
  if (!openRouterApiKey) {
    throw new Error(
      "OpenRouter API key is not passed in the speech parameters",
    );
  }

  const client = createOpenRouterOpenAIClient(openRouterApiKey);
  const responseFormat = resolveOpenRouterSpeechFormat(
    options.model,
    options.responseFormat,
  );
  const provider = resolveOpenRouterProvider(options.model, {
    openRouterProvider: options.openRouterProvider,
    openRouterAllowAllProviders: options.openRouterAllowAllProviders,
  });

  const body: Record<string, unknown> = {
    model: options.model,
    input: text,
    voice: options.voice,
    response_format: responseFormat,
  };

  if (options.speed !== undefined) body.speed = options.speed;
  if (provider || options.instructions) {
    const mergedProvider: Record<string, unknown> = { ...(provider ?? {}) };
    if (options.instructions) {
      mergedProvider.options = {
        openai: { instructions: options.instructions },
      };
    }
    body.provider = mergedProvider;
  }

  const response = await client.audio.speech.create(
    body as unknown as Parameters<typeof client.audio.speech.create>[0],
  );

  const arrayBuffer = await response.arrayBuffer();
  return {
    audio: Buffer.from(arrayBuffer),
    contentType: CONTENT_TYPE_BY_FORMAT[responseFormat] ?? "application/octet-stream",
  };
}

export async function speakOpenRouterStream(
  text: string,
  options: OpenRouterSpeechOptions,
  openRouterApiKey?: string,
): Promise<ReadableStream<Uint8Array>> {
  validateOpenRouterSpeechOptions(options);
  if (!openRouterApiKey) {
    throw new Error(
      "OpenRouter API key is not passed in the speech parameters",
    );
  }

  const client = createOpenRouterOpenAIClient(openRouterApiKey);
  const responseFormat = resolveOpenRouterSpeechFormat(
    options.model,
    options.responseFormat,
  );
  const provider = resolveOpenRouterProvider(options.model, {
    openRouterProvider: options.openRouterProvider,
    openRouterAllowAllProviders: options.openRouterAllowAllProviders,
  });

  const body: Record<string, unknown> = {
    model: options.model,
    input: text,
    voice: options.voice,
    response_format: responseFormat,
  };

  if (options.speed !== undefined) body.speed = options.speed;
  if (provider) body.provider = provider;

  const stream = await client.audio.speech.create(
    body as unknown as Parameters<typeof client.audio.speech.create>[0],
  );

  return stream.body as ReadableStream<Uint8Array>;
}
