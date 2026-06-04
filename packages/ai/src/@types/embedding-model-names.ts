export type OpenAIEmbeddingModel =
  | "text-embedding-3-small"
  | "text-embedding-3-large"
  | "text-embedding-ada-002";

export type GeminiEmbeddingModel =
  | "gemini-embedding-001"
  | "gemini-embedding-2-preview";

type OpenRouterOpenAIEmbeddingModel = `openai/${OpenAIEmbeddingModel}`;

type OpenRouterGoogleEmbeddingModel = `google/${GeminiEmbeddingModel}`;

type OpenRouterQwenEmbeddingModel =
  | "qwen/qwen3-embedding-8b"
  | "qwen/qwen3-embedding-4b"
  | "qwen/qwen3-embedding-0.6b";

type OpenRouterOtherEmbeddingModel =
  | "BAAI/bge-m3"
  | "perplexity/pplx-embed-v1-4b"
  | "perplexity/pplx-embed-v1-0.6b";

export type OpenRouterEmbeddingModel =
  | OpenRouterOpenAIEmbeddingModel
  | OpenRouterGoogleEmbeddingModel
  | OpenRouterQwenEmbeddingModel
  | OpenRouterOtherEmbeddingModel;

export type OpenRouterPrefixedEmbeddingModel =
  `openrouter/${OpenRouterEmbeddingModel}`;

export type AIEmbeddingModelNames =
  | OpenAIEmbeddingModel
  | GeminiEmbeddingModel
  | OpenRouterPrefixedEmbeddingModel;
