import type { AudioMimeType } from "../@types/audio";
import type { OpenRouterProviderPreferences } from "../@types/openrouter-provider";

export type WhisperModel =
  | "whisper-1"
  | "gpt-4o-transcribe"
  | "gpt-4o-mini-transcribe"
  | "gpt-4o-mini-transcribe-2025-12-15"
  | "gpt-4o-transcribe-diarize";

export type OpenAITranscriptionResponseFormat =
  | "json"
  | "text"
  | "srt"
  | "verbose_json"
  | "vtt"
  | "diarized_json";

export type OpenAITranscriptionOptions = {
  model?: WhisperModel;
  languageIn2Digits?: string;
  prompt?: string;
  responseFormat?: OpenAITranscriptionResponseFormat;
  temperature?: number;
  timestampGranularities?: ("word" | "segment")[];
  format?: string | AudioMimeType;
  /** Obrigatório para `gpt-4o-transcribe-diarize` em áudio > 30s */
  chunkingStrategy?: "auto" | { type: "server_vad" };
};

export type TranscriptionWord = {
  word: string;
  start: number;
  end: number;
};

export type TranscriptionSegment = {
  id?: number;
  start: number;
  end: number;
  text: string;
};

export type DiarizedSegment = {
  speaker: string;
  start: number;
  end: number;
  text: string;
};

export type OpenAITranscriptionDetailed = {
  text: string;
  language?: string;
  duration?: number;
  words?: TranscriptionWord[];
  segments?: TranscriptionSegment[];
  speakers?: DiarizedSegment[];
};

export type OpenRouterTranscriptionOptions = {
  model: string;
  format?: string | AudioMimeType;
  language?: string;
  temperature?: number;
  openRouterProvider?: OpenRouterProviderPreferences;
  /** Quando true, não aplica default de provider (ex.: deepseek only) */
  openRouterAllowAllProviders?: boolean;
};

export type OpenRouterTranscriptionResult = {
  text: string;
  usage?: {
    seconds?: number;
    cost?: number;
    input_tokens?: number;
    output_tokens?: number;
    total_tokens?: number;
  };
};

export type OpenAISpeechModel =
  | "tts-1"
  | "tts-1-hd"
  | "gpt-4o-mini-tts"
  | "gpt-4o-mini-tts-2025-12-15";

export type OpenAISpeechResponseFormat =
  | "mp3"
  | "opus"
  | "aac"
  | "flac"
  | "wav"
  | "pcm";

export type OpenAISpeechOptions = {
  model?: OpenAISpeechModel;
  voice: string;
  responseFormat?: OpenAISpeechResponseFormat;
  speed?: number;
  /** Apenas modelos gpt-4o-mini-tts* */
  instructions?: string;
};

export type OpenRouterSpeechOptions = {
  model: string;
  voice: string;
  responseFormat?: "mp3" | "pcm";
  speed?: number;
  instructions?: string;
  openRouterProvider?: OpenRouterProviderPreferences;
  openRouterAllowAllProviders?: boolean;
};

export type SpeechResult = {
  audio: Buffer;
  contentType: string;
};

export type GeminiTranscriptionOptions = {
  model?: string;
  prompt?: string;
  googleGeminiToken?: string;
};

/** A API pública da Anthropic não oferece STT/TTS nativo (apenas texto/imagem/documento). */
export const ANTHROPIC_NO_NATIVE_AUDIO =
  "A API da Anthropic não suporta áudio nativo. Use STT (OpenAI/OpenRouter) e depois AI.call com modelos anthropic." as const;
