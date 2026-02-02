import * as fs from "fs";
import * as path from "path";
import OpenAI from "openai";
import { toFile } from "openai";
import type { AudioBuffer, AudioMimeType } from "../@types/audio";
import { MIME_TO_EXTENSION } from "../@types/audio";

/** Modelos disponíveis na API de transcrição OpenAI (Speech-to-Text) */
export type WhisperModel =
  | "whisper-1"
  | "gpt-4o-transcribe"
  | "gpt-4o-mini-transcribe"
  | "gpt-4o-mini-transcribe-2025-12-15"
  | "gpt-4o-transcribe-diarize";

export type WhisperTranscriptionOptions = {
  /** Modelo de transcrição. Padrão: "whisper-1". gpt-4o-transcribe e gpt-4o-mini-transcribe têm maior qualidade. */
  model?: WhisperModel;
  languageIn2Digits?: string;
  prompt?: string;
  responseFormat?: "json" | "text" | "srt" | "verbose_json" | "vtt";
  temperature?: number;
  timestampGranularities?: ("word" | "segment")[];
  /** Formato do áudio: extensão ("mp3", "wav", "webm") ou MIME type ("audio/wav", "audio/webm") */
  format?: string | AudioMimeType;
};

function getExtension(format?: string | AudioMimeType): string {
  if (!format) return "mp3";
  if (format.startsWith("audio/")) {
    return MIME_TO_EXTENSION[format as AudioMimeType] ?? "mp3";
  }
  return format.replace(/^\./, "");
}

function toBuffer(audioBuffer: AudioBuffer): Buffer {
  if (audioBuffer instanceof Buffer) return audioBuffer;
  if (audioBuffer instanceof ArrayBuffer) return Buffer.from(audioBuffer);
  return Buffer.from(audioBuffer as Uint8Array);
}

export class LangchainAudioTranscription {
  static async transcribeWithWhisper(
    audioBuffer: AudioBuffer,
    options: WhisperTranscriptionOptions = {},
    openAIApiKey?: string
  ): Promise<string> {
    if (openAIApiKey) {
      process.env.OPENAI_API_KEY = openAIApiKey;
    }

    const buffer = toBuffer(audioBuffer);
    const extension = getExtension(options.format);
    const fileName = `whisper-${Date.now()}.${extension}`;

    const file = await toFile(buffer, fileName);

    const openai = new OpenAI();

    const transcriptionParams: OpenAI.Audio.TranscriptionCreateParams = {
      file,
      model: options.model ?? "whisper-1",
      response_format: options.responseFormat ?? "text",
    };

    if (options.languageIn2Digits) {
      transcriptionParams.language = options.languageIn2Digits;
    }
    if (options.prompt) {
      transcriptionParams.prompt = options.prompt;
    }
    if (options.temperature !== undefined) {
      transcriptionParams.temperature = options.temperature;
    }
    if (options.timestampGranularities) {
      transcriptionParams.timestamp_granularities =
        options.timestampGranularities;
    }

    const response = await openai.audio.transcriptions.create(
      transcriptionParams
    );

    return typeof response === "string" ? response : response.text;
  }

  static async transcribeFileWithWhisper(
    filePath: string,
    options: WhisperTranscriptionOptions = {},
    openAIApiKey?: string
  ): Promise<string> {
    if (!fs.existsSync(filePath)) {
      throw new Error(`Arquivo não encontrado: ${filePath}`);
    }

    const audioBuffer = fs.readFileSync(filePath);
    const format =
      options.format ?? (path.extname(filePath).replace(/^\./, "") || "mp3");
    return this.transcribeWithWhisper(
      audioBuffer,
      { ...options, format },
      openAIApiKey
    );
  }
}
