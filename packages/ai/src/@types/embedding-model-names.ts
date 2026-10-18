export type OpenAIEmbeddingModel =
  | "text-embedding-3-small"
  | "text-embedding-3-large"
  | "text-embedding-ada-002";

export type GeminiEmbeddingModel =
  | "gemini-embedding-2"
  | "gemini-embedding-2-preview"
  | "gemini-embedding-001";

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

/**
 * União agregada dos modelos de embedding conhecidos, com escape hatch.
 * Igual a `AIModelNames`: os tipos de provider seguem estritos, mas `(string & {})`
 * aceita um modelo novo sem exigir release da lib.
 */
export type AIEmbeddingModelNames =
  | OpenAIEmbeddingModel
  | GeminiEmbeddingModel
  | OpenRouterPrefixedEmbeddingModel
  | (string & {});
