import * as fs from "fs";
import * as path from "path";
import OpenAI from "openai";
import { toFile } from "openai";
import type { AudioBuffer } from "../@types/audio";
import type {
  OpenAITranscriptionDetailed,
  OpenAITranscriptionOptions,
  TranscriptionSegment,
  TranscriptionWord,
  DiarizedSegment,
} from "./types";
import { getAudioExtension, toAudioBuffer } from "./utils";

function createOpenAIClient(apiKey?: string): OpenAI {
  if (apiKey) {
    return new OpenAI({ apiKey });
  }
  return new OpenAI();
}

async function createAudioFile(
  audioBuffer: AudioBuffer,
  format?: OpenAITranscriptionOptions["format"],
) {
  const buffer = toAudioBuffer(audioBuffer);
  const extension = getAudioExtension(format);
  const fileName = `whisper-${Date.now()}.${extension}`;
  return toFile(buffer, fileName);
}

function validateTranscriptionOptions(options: OpenAITranscriptionOptions): void {
  const model = options.model ?? "whisper-1";
  const format = options.responseFormat ?? "text";

  if (
    options.timestampGranularities?.length &&
    (model !== "whisper-1" || format !== "verbose_json")
  ) {
    throw new Error(
      "[@luanpoppe/ai] timestampGranularities só é suportado com model whisper-1 e responseFormat verbose_json.",
    );
  }

  if (model === "gpt-4o-transcribe-diarize" && format === "diarized_json") {
    if (!options.chunkingStrategy) {
      options.chunkingStrategy = "auto";
    }
  }
}

function mapVerboseResponse(
  response: Record<string, unknown>,
): OpenAITranscriptionDetailed {
  const words = Array.isArray(response.words)
    ? (response.words as TranscriptionWord[])
    : undefined;
  const segments = Array.isArray(response.segments)
    ? (response.segments as TranscriptionSegment[])
    : undefined;

  const detailed: OpenAITranscriptionDetailed = {
    text: String(response.text ?? ""),
  };
  if (typeof response.language === "string") {
    detailed.language = response.language;
  }
  if (typeof response.duration === "number") {
    detailed.duration = response.duration;
  }
  if (words) detailed.words = words;
  if (segments) detailed.segments = segments;
  return detailed;
}

function mapDiarizedResponse(
  response: Record<string, unknown>,
): OpenAITranscriptionDetailed {
  const segments = Array.isArray(response.segments)
    ? (response.segments as Array<Record<string, unknown>>)
    : [];

  const speakers: DiarizedSegment[] = segments.map((seg) => ({
    speaker: String(seg.speaker ?? "unknown"),
    start: Number(seg.start ?? 0),
    end: Number(seg.end ?? 0),
    text: String(seg.text ?? ""),
  }));

  return {
    text: String(response.text ?? speakers.map((s) => s.text).join(" ")),
    speakers,
    segments: speakers.map((s, id) => ({
      id,
      start: s.start,
      end: s.end,
      text: s.text,
    })),
  };
}

function mapTranscriptionResponse(
  response: unknown,
  responseFormat: OpenAITranscriptionOptions["responseFormat"],
): OpenAITranscriptionDetailed {
  if (typeof response === "string") {
    return { text: response };
  }

  const obj = response as Record<string, unknown>;
  if (responseFormat === "diarized_json") {
    return mapDiarizedResponse(obj);
  }
  if (responseFormat === "verbose_json") {
    return mapVerboseResponse(obj);
  }
  return { text: String(obj.text ?? "") };
}

export async function transcribeDetailedOpenAI(
  audioBuffer: AudioBuffer,
  options: OpenAITranscriptionOptions = {},
  openAIApiKey?: string,
): Promise<OpenAITranscriptionDetailed> {
  validateTranscriptionOptions(options);

  const openai = createOpenAIClient(openAIApiKey);
  const file = await createAudioFile(audioBuffer, options.format);
  const responseFormat = options.responseFormat ?? "verbose_json";
  const model = options.model ?? "whisper-1";

  const params: OpenAI.Audio.TranscriptionCreateParams = {
    file,
    model,
    response_format: responseFormat as OpenAI.Audio.TranscriptionCreateParams["response_format"],
  };

  if (options.languageIn2Digits) params.language = options.languageIn2Digits;
  if (options.prompt) params.prompt = options.prompt;
  if (options.temperature !== undefined) params.temperature = options.temperature;
  if (options.timestampGranularities) {
    params.timestamp_granularities = options.timestampGranularities;
  }
  if (options.chunkingStrategy) {
    (params as OpenAI.Audio.TranscriptionCreateParams & {
      chunking_strategy?: unknown;
    }).chunking_strategy = options.chunkingStrategy;
  }

  const response = await openai.audio.transcriptions.create(params);
  return mapTranscriptionResponse(response, responseFormat);
}

export async function transcribeWithWhisperOpenAI(
  audioBuffer: AudioBuffer,
  options: OpenAITranscriptionOptions = {},
  openAIApiKey?: string,
): Promise<string> {
  const detailed = await transcribeDetailedOpenAI(
    audioBuffer,
    { ...options, responseFormat: options.responseFormat ?? "text" },
    openAIApiKey,
  );
  return detailed.text;
}

export async function transcribeToSrtOpenAI(
  audioBuffer: AudioBuffer,
  options: Omit<OpenAITranscriptionOptions, "responseFormat"> = {},
  openAIApiKey?: string,
): Promise<string> {
  const detailed = await transcribeDetailedOpenAI(
    audioBuffer,
    { ...options, model: options.model ?? "whisper-1", responseFormat: "srt" },
    openAIApiKey,
  );
  return detailed.text;
}

export async function transcribeToVttOpenAI(
  audioBuffer: AudioBuffer,
  options: Omit<OpenAITranscriptionOptions, "responseFormat"> = {},
  openAIApiKey?: string,
): Promise<string> {
  const detailed = await transcribeDetailedOpenAI(
    audioBuffer,
    { ...options, model: options.model ?? "whisper-1", responseFormat: "vtt" },
    openAIApiKey,
  );
  return detailed.text;
}

export async function transcribeDiarizedOpenAI(
  audioBuffer: AudioBuffer,
  options: Omit<OpenAITranscriptionOptions, "model" | "responseFormat"> = {},
  openAIApiKey?: string,
): Promise<OpenAITranscriptionDetailed> {
  return transcribeDetailedOpenAI(
    audioBuffer,
    {
      ...options,
      model: "gpt-4o-transcribe-diarize",
      responseFormat: "diarized_json",
      chunkingStrategy: options.chunkingStrategy ?? "auto",
    },
    openAIApiKey,
  );
}

export async function translateOpenAI(
  audioBuffer: AudioBuffer,
  options: Omit<OpenAITranscriptionOptions, "responseFormat"> = {},
  openAIApiKey?: string,
): Promise<string> {
  const openai = createOpenAIClient(openAIApiKey);
  const file = await createAudioFile(audioBuffer, options.format);

  const response = await openai.audio.translations.create({
    file,
    model: "whisper-1",
    ...(options.prompt ? { prompt: options.prompt } : {}),
    ...(options.temperature !== undefined
      ? { temperature: options.temperature }
      : {}),
  });

  return typeof response === "string" ? response : response.text;
}

export async function transcribeFileDetailedOpenAI(
  filePath: string,
  options: OpenAITranscriptionOptions = {},
  openAIApiKey?: string,
): Promise<OpenAITranscriptionDetailed> {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Arquivo não encontrado: ${filePath}`);
  }
  const audioBuffer = fs.readFileSync(filePath);
  const format =
    options.format ?? (path.extname(filePath).replace(/^\./, "") || "mp3");
  return transcribeDetailedOpenAI(
    audioBuffer,
    { ...options, format },
    openAIApiKey,
  );
}

export async function transcribeFileWithWhisperOpenAI(
  filePath: string,
  options: OpenAITranscriptionOptions = {},
  openAIApiKey?: string,
): Promise<string> {
  const detailed = await transcribeFileDetailedOpenAI(
    filePath,
    options,
    openAIApiKey,
  );
  return detailed.text;
}
