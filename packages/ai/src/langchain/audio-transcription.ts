import type { AudioBuffer, AudioMimeType } from "../@types/audio";
import { AIAudio } from "../audio";
import type {
  OpenAITranscriptionOptions,
  WhisperModel,
} from "../audio/types";

export type { WhisperModel };

/** @deprecated Use OpenAITranscriptionOptions from AIAudio */
export type WhisperTranscriptionOptions = OpenAITranscriptionOptions;

/**
 * @deprecated Use {@link AIAudio.transcribeWithWhisper} instead.
 */
export class AIAudioTranscription {
  static transcribeWithWhisper(
    audioBuffer: AudioBuffer,
    options: WhisperTranscriptionOptions = {},
    openAIApiKey?: string,
  ): Promise<string> {
    return AIAudio.transcribeWithWhisper(audioBuffer, options, openAIApiKey);
  }

  static transcribeFileWithWhisper(
    filePath: string,
    options: WhisperTranscriptionOptions = {},
    openAIApiKey?: string,
  ): Promise<string> {
    return AIAudio.transcribeFileWithWhisper(filePath, options, openAIApiKey);
  }
}

export type { AudioBuffer, AudioMimeType };
