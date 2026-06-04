import type { OpenRouterProviderPreferences } from "../@types/openrouter-provider";
import type { AIEmbeddingModelNames } from "../@types/embedding-model-names";

export type GeminiEmbeddingTaskType =
  | "RETRIEVAL_DOCUMENT"
  | "RETRIEVAL_QUERY"
  | "SEMANTIC_SIMILARITY"
  | "CLASSIFICATION"
  | "CLUSTERING"
  | "QUESTION_ANSWERING"
  | "FACT_VERIFICATION"
  | "CODE_RETRIEVAL_QUERY";

export type EmbeddingUsage = {
  prompt_tokens?: number;
  total_tokens?: number;
};

export type EmbeddingResult = {
  embeddings: number[][];
  model: string;
  usage?: EmbeddingUsage;
};

export type OpenAIEmbeddingOptions = {
  model: AIEmbeddingModelNames;
  dimensions?: number;
  encodingFormat?: "float" | "base64";
};

export type OpenRouterEmbeddingOptions = {
  model: AIEmbeddingModelNames;
  dimensions?: number;
  encodingFormat?: "float" | "base64";
  openRouterProvider?: OpenRouterProviderPreferences;
  openRouterAllowAllProviders?: boolean;
};

export type GeminiEmbeddingOptions = {
  model: AIEmbeddingModelNames;
  dimensions?: number;
  taskType?: GeminiEmbeddingTaskType;
};

export type EmbedApiKeys = {
  openAIApiKey?: string;
  googleGeminiToken?: string;
  openRouterApiKey?: string;
};

/** A API pública da Anthropic não oferece embeddings nativos (recomenda Voyage AI para RAG com Claude). */
export const ANTHROPIC_NO_NATIVE_EMBEDDINGS =
  "A API da Anthropic não suporta embeddings nativos. Use OpenAI, Gemini ou OpenRouter para vetorizar texto antes de AI.call com modelos anthropic." as const;
