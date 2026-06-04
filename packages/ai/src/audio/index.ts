import type { AudioBuffer } from "../@types/audio";
import type {
  GeminiTranscriptionOptions,
  OpenAITranscriptionDetailed,
  OpenAITranscriptionOptions,
  OpenRouterSpeechOptions,
  OpenRouterTranscriptionOptions,
  OpenRouterTranscriptionResult,
  OpenAISpeechOptions,
  SpeechResult,
} from "./types";
import {
  transcribeDetailedOpenAI,
  transcribeDiarizedOpenAI,
  transcribeFileDetailedOpenAI,
  transcribeFileWithWhisperOpenAI,
  transcribeToSrtOpenAI,
  transcribeToVttOpenAI,
  transcribeWithWhisperOpenAI,
  translateOpenAI,
} from "./transcription-openai";
import { transcribeOpenRouter } from "./transcription-openrouter";
import { speakOpenAI, speakOpenAIStream } from "./speech-openai";
import { speakOpenRouter, speakOpenRouterStream } from "./speech-openrouter";
import { transcribeWithGeminiPrompt } from "./gemini-transcription";

export type {
  WhisperModel,
  OpenAITranscriptionOptions,
  OpenAITranscriptionResponseFormat,
  OpenAITranscriptionDetailed,
  OpenRouterTranscriptionOptions,
  OpenRouterTranscriptionResult,
  OpenAISpeechOptions,
  OpenAISpeechModel,
  OpenRouterSpeechOptions,
  SpeechResult,
  TranscriptionWord,
  TranscriptionSegment,
  DiarizedSegment,
  GeminiTranscriptionOptions,
} from "./types";

export { ANTHROPIC_NO_NATIVE_AUDIO } from "./types";

export class AIAudio {
  static transcribeDetailedOpenAI = transcribeDetailedOpenAI;
  static transcribeWithWhisper = transcribeWithWhisperOpenAI;
  static transcribeFileWithWhisper = transcribeFileWithWhisperOpenAI;
  static transcribeToSrtOpenAI = transcribeToSrtOpenAI;
  static transcribeToVttOpenAI = transcribeToVttOpenAI;
  static transcribeDiarizedOpenAI = transcribeDiarizedOpenAI;
  static translateOpenAI = translateOpenAI;
  static transcribeOpenRouter = transcribeOpenRouter;
  static speakOpenAI = speakOpenAI;
  static speakOpenAIStream = speakOpenAIStream;
  static speakOpenRouter = speakOpenRouter;
  static speakOpenRouterStream = speakOpenRouterStream;
  static transcribeWithGeminiPrompt = transcribeWithGeminiPrompt;

  /** @deprecated Use AIAudio.transcribeWithWhisper */
  static transcribeWithWhisperLegacy(
    audioBuffer: AudioBuffer,
    options?: OpenAITranscriptionOptions,
    openAIApiKey?: string,
  ): Promise<string> {
    return transcribeWithWhisperOpenAI(audioBuffer, options, openAIApiKey);
  }

  static async transcribeFileDetailedOpenAI(
    filePath: string,
    options?: OpenAITranscriptionOptions,
    openAIApiKey?: string,
  ): Promise<OpenAITranscriptionDetailed> {
    return transcribeFileDetailedOpenAI(filePath, options, openAIApiKey);
  }

  static async transcribeDetailedOpenRouter(
    audioBuffer: AudioBuffer,
    options: OpenRouterTranscriptionOptions,
    openRouterApiKey?: string,
  ): Promise<OpenRouterTranscriptionResult> {
    return transcribeOpenRouter(audioBuffer, options, openRouterApiKey);
  }

  static async speak(
    text: string,
    options: OpenAISpeechOptions & { provider?: "openai" },
    openAIApiKey?: string,
  ): Promise<SpeechResult> {
    return speakOpenAI(text, options, openAIApiKey);
  }

  static async speakViaOpenRouter(
    text: string,
    options: OpenRouterSpeechOptions,
    openRouterApiKey?: string,
  ): Promise<SpeechResult> {
    return speakOpenRouter(text, options, openRouterApiKey);
  }
}
