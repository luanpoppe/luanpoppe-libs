import type { AIEmbeddingModelNames } from "../@types/embedding-model-names";
import { embedOpenAI } from "./embed-openai";
import { embedOpenRouter } from "./embed-openrouter";
import { embedGemini } from "./embed-gemini";
import {
  embedWithModel,
  type EmbedOptions,
} from "./route";
import type {
  EmbedApiKeys,
  EmbeddingResult,
  GeminiEmbeddingOptions,
  GeminiEmbeddingTaskType,
  OpenAIEmbeddingOptions,
  OpenRouterEmbeddingOptions,
} from "./types";

export type {
  AIEmbeddingModelNames,
  OpenAIEmbeddingModel,
  GeminiEmbeddingModel,
  OpenRouterEmbeddingModel,
  OpenRouterPrefixedEmbeddingModel,
} from "../@types/embedding-model-names";

export type {
  EmbeddingResult,
  EmbeddingUsage,
  OpenAIEmbeddingOptions,
  OpenRouterEmbeddingOptions,
  GeminiEmbeddingOptions,
  GeminiEmbeddingTaskType,
  EmbedApiKeys,
} from "./types";

export type { EmbedOptions } from "./route";

export { ANTHROPIC_NO_NATIVE_EMBEDDINGS } from "./types";
export { embedWithModel };

export class AIEmbeddings {
  static embedOpenAI = embedOpenAI;
  static embedOpenRouter = embedOpenRouter;
  static embedGemini = embedGemini;

  static async embed(
    input: string | string[],
    options: EmbedOptions,
    keys: EmbedApiKeys,
  ): Promise<EmbeddingResult> {
    return embedWithModel(input, options, keys);
  }

  static async embedDocuments(
    texts: string[],
    options: EmbedOptions,
    keys: EmbedApiKeys,
  ): Promise<number[][]> {
    const taskType =
      options.taskType ??
      (options.model.startsWith("gemini-embedding-")
        ? ("RETRIEVAL_DOCUMENT" as const)
        : undefined);

    const result = await embedWithModel(texts, { ...options, taskType }, keys);
    return result.embeddings;
  }

  static async embedQuery(
    text: string,
    options: EmbedOptions,
    keys: EmbedApiKeys,
  ): Promise<number[]> {
    const taskType =
      options.taskType ??
      (options.model.startsWith("gemini-embedding-")
        ? ("RETRIEVAL_QUERY" as const)
        : undefined);

    const result = await embedWithModel(text, { ...options, taskType }, keys);
    return result.embeddings[0] ?? [];
  }
}
