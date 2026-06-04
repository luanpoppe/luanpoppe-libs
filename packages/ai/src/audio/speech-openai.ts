import OpenAI from "openai";
import type { OpenAISpeechOptions, SpeechResult } from "./types";

const CONTENT_TYPE_BY_FORMAT: Record<string, string> = {
  mp3: "audio/mpeg",
  opus: "audio/opus",
  aac: "audio/aac",
  flac: "audio/flac",
  wav: "audio/wav",
  pcm: "audio/pcm",
};

function validateSpeechOptions(options: OpenAISpeechOptions): void {
  const model = options.model ?? "gpt-4o-mini-tts";
  if (
    options.instructions &&
    model !== "gpt-4o-mini-tts" &&
    model !== "gpt-4o-mini-tts-2025-12-15"
  ) {
    throw new Error(
      "[@luanpoppe/ai] instructions em TTS só é suportado por modelos gpt-4o-mini-tts.",
    );
  }
}

function createOpenAIClient(apiKey?: string): OpenAI {
  if (!apiKey) {
    throw new Error("OpenAI API key is not passed in the speech parameters");
  }
  return new OpenAI({ apiKey });
}

export async function speakOpenAI(
  text: string,
  options: OpenAISpeechOptions,
  openAIApiKey?: string,
): Promise<SpeechResult> {
  validateSpeechOptions(options);
  const openai = createOpenAIClient(openAIApiKey);
  const responseFormat = options.responseFormat ?? "mp3";
  const model = options.model ?? "gpt-4o-mini-tts";

  const response = await openai.audio.speech.create({
    model,
    voice: options.voice as OpenAI.Audio.SpeechCreateParams["voice"],
    input: text,
    response_format: responseFormat,
    ...(options.speed !== undefined ? { speed: options.speed } : {}),
    ...(options.instructions ? { instructions: options.instructions } : {}),
  });

  const arrayBuffer = await response.arrayBuffer();
  return {
    audio: Buffer.from(arrayBuffer),
    contentType: CONTENT_TYPE_BY_FORMAT[responseFormat] ?? "application/octet-stream",
  };
}

export async function speakOpenAIStream(
  text: string,
  options: OpenAISpeechOptions,
  openAIApiKey?: string,
): Promise<ReadableStream<Uint8Array>> {
  validateSpeechOptions(options);
  const openai = createOpenAIClient(openAIApiKey);
  const responseFormat = options.responseFormat ?? "mp3";
  const model = options.model ?? "gpt-4o-mini-tts";

  const stream = await openai.audio.speech.create({
    model,
    voice: options.voice as OpenAI.Audio.SpeechCreateParams["voice"],
    input: text,
    response_format: responseFormat,
    ...(options.speed !== undefined ? { speed: options.speed } : {}),
    ...(options.instructions ? { instructions: options.instructions } : {}),
  });

  return stream.body as ReadableStream<Uint8Array>;
}
