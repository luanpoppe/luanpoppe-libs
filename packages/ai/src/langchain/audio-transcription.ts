import { Document } from "@langchain/core/documents";
import * as fs from "fs";
import type { AudioBuffer } from "../@types/audio";
import { OpenAIWhisperAudio } from "@langchain/community/document_loaders/fs/openai_whisper_audio";
import { FilesUtils } from "../utils/files-utils";

export type WhisperTranscriptionOptions = {
  language?: string;
  prompt?: string;
  responseFormat?: "json" | "text" | "srt" | "verbose_json" | "vtt";
  temperature?: number;
  timestampGranularities?: ("word" | "segment")[];
};

export class LangchainAudioTranscription {
  private static extractTextFromDocs(docs: Document[]): string {
    if (docs.length === 0) {
      throw new Error("Nenhum documento foi retornado pela transcrição");
    }
    const firstDoc = docs[0];
    if (!firstDoc) {
      throw new Error("Documento vazio retornado pela transcrição");
    }
    // LangChain.js usa pageContent (camelCase), não page_content
    return firstDoc.pageContent;
  }

  static async transcribeWithWhisper(
    audioBuffer: AudioBuffer,
    options: WhisperTranscriptionOptions = {},
    openAIApiKey?: string
  ): Promise<string> {
    const tempFilePath = FilesUtils.createTempFile(audioBuffer, "whisper");

    try {
      // Configura a API key se fornecida
      if (openAIApiKey) {
        process.env.OPENAI_API_KEY = openAIApiKey;
      }

      const transcriptionParams: any = {
        response_format: options.responseFormat || "text",
      };

      if (options.language) {
        transcriptionParams.language = options.language;
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

      const loader = new OpenAIWhisperAudio(tempFilePath, {
        transcriptionCreateParams: transcriptionParams,
      });

      const docs: Document[] = await loader.load();
      return this.extractTextFromDocs(docs);
    } finally {
      FilesUtils.cleanupTempFile(tempFilePath);
    }
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
    return this.transcribeWithWhisper(audioBuffer, options, openAIApiKey);
  }
}
