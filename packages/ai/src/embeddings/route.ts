import type {
  EmbedApiKeys,
  EmbeddingResult,
  GeminiEmbeddingOptions,
  OpenAIEmbeddingOptions,
  OpenRouterEmbeddingOptions,
} from "./types";
import type { AIEmbeddingModelNames } from "../@types/embedding-model-names";
import { embedOpenAI } from "./embed-openai";
import { embedOpenRouter } from "./embed-openrouter";
import { embedGemini } from "./embed-gemini";
import {
  isGeminiEmbeddingModel,
  isOpenAIEmbeddingModel,
  isOpenRouterEmbeddingModel,
} from "./utils";

export type EmbedOptions = {
  model: AIEmbeddingModelNames;
  dimensions?: number;
  encodingFormat?: "float" | "base64";
  taskType?: GeminiEmbeddingOptions["taskType"];
  openRouterProvider?: OpenRouterEmbeddingOptions["openRouterProvider"];
  openRouterAllowAllProviders?: boolean;
};

export async function embedWithModel(
  input: string | string[],
  options: EmbedOptions,
  keys: EmbedApiKeys,
): Promise<EmbeddingResult> {
  const { model } = options;

  if (isOpenRouterEmbeddingModel(model)) {
    const orOptions: OpenRouterEmbeddingOptions = { model };
    if (options.dimensions !== undefined) orOptions.dimensions = options.dimensions;
    if (options.encodingFormat) orOptions.encodingFormat = options.encodingFormat;
    if (options.openRouterProvider) {
      orOptions.openRouterProvider = options.openRouterProvider;
    }
    if (options.openRouterAllowAllProviders !== undefined) {
      orOptions.openRouterAllowAllProviders = options.openRouterAllowAllProviders;
    }
    return embedOpenRouter(input, orOptions, keys.openRouterApiKey);
  }

  if (isOpenAIEmbeddingModel(model)) {
    const oaiOptions: OpenAIEmbeddingOptions = { model };
    if (options.dimensions !== undefined) oaiOptions.dimensions = options.dimensions;
    if (options.encodingFormat) oaiOptions.encodingFormat = options.encodingFormat;
    return embedOpenAI(input, oaiOptions, keys.openAIApiKey);
  }

  if (isGeminiEmbeddingModel(model)) {
    const geminiOptions: GeminiEmbeddingOptions = { model };
    if (options.dimensions !== undefined) geminiOptions.dimensions = options.dimensions;
    if (options.taskType) geminiOptions.taskType = options.taskType;
    return embedGemini(input, geminiOptions, keys.googleGeminiToken);
  }

  throw new Error(`[@luanpoppe/ai] Modelo de embedding não suportado: ${model}`);
}
