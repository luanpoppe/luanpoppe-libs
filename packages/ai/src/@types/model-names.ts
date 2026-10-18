export type ChatGPTModels =
  | "gpt-4"
  | "gpt-4o"
  | "gpt-4o-mini"
  | "gpt-4.1"
  | "gpt-4.1-mini"
  | "gpt-4.1-nano"
  | "gpt-5"
  | "gpt-5.1"
  | "gpt-5-mini"
  | "gpt-5-nano"
  | "gpt-5.2"
  | "gpt-5.2-chat-latest"
  | "gpt-5.2-chat"
  | "gpt-5.3-chat-latest"
  | "gpt-5.3-chat"
  | "gpt-5.4"
  | "gpt-5.4-pro"
  | "gpt-5.4-mini"
  | "gpt-5.4-nano"
  | "gpt-5.5"
  | "gpt-5.5-pro"
  | "gpt-5.6"
  | "gpt-5.6-sol"
  | "gpt-5.6-terra"
  | "gpt-5.6-luna"
  | "gpt-6-astra"
  | "gpt-6.1-sol"
  | "gpt-6-luna"
  | "gpt-chat-latest"
  | "o3"
  | "o4-mini";

export type GeminiModels =
  | "gemini-2.5-flash"
  | "gemini-2.5-flash-lite"
  | "gemini-2.5-pro"
  | "gemini-3-flash"
  | "gemini-3-pro"
  | "gemini-3-flash-preview"
  | "gemini-3.1-pro-preview"
  | "gemini-3.1-flash-lite"
  | "gemini-3.5-flash"
  | "gemini-3.5-flash-lite"
  | "gemini-3.8-flash"
  | "gemini-4-argon";

export type AnthropicModels =
  | "claude-opus-5.5"
  | "claude-opus-5"
  | "claude-opus-4.8"
  | "claude-opus-4.8-fast"
  | "claude-opus-4.7"
  | "claude-opus-4.7-fast"
  | "claude-opus-4.6"
  | "claude-opus-4.6-fast"
  | "claude-opus-4.5"
  | "claude-sonnet-5.5"
  | "claude-sonnet-5"
  | "claude-sonnet-4.6"
  | "claude-sonnet-4.5"
  | "claude-haiku-5.5"
  | "claude-haiku-4.5"
  | "claude-fable-5.1"
  | "claude-fable-5"
  | "claude-opus-4.1"
  | "claude-opus-4"
  | "claude-sonnet-4"
  | "claude-3.5-haiku"
  | "claude-3-haiku";

/** Modelos DeepSeek via OpenRouter (prefixo `openrouter/deepseek/`) */
export type DeepSeekModels =
  | "deepseek-flash"
  | "deepseek-v4.1-flash"
  | "deepseek-v4-pro"
  | "deepseek-v4-flash"
  | "deepseek-v4-flash:free"
  | "deepseek-v4-flash-vision-exp"
  | "deepseek-chat"
  | "deepseek-chat-v3.1"
  | "deepseek-r1"
  | "deepseek-r1-0528"
  | "deepseek-v3.2"
  | "deepseek-v3.2-speciale"
  | "deepseek-v3.1-terminus";

/** Modelos Qwen via OpenRouter (prefixo `openrouter/qwen/`) */
export type QwenModels =
  | "qwen3.8-max"
  | "qwen3.8-max-0902"
  | "qwen3.8-max-prime"
  | "qwen3.8-max-preview"
  | "qwen3.8-flash"
  | "qwen3.8-flash-next"
  | "qwen3.8-27b"
  | "qwen3.7-max"
  | "qwen3.7-plus"
  | "qwen3.7-flash"
  | "qwen3.6-plus"
  | "qwen3.6-flash"
  | "qwen3.6-max-preview"
  | "qwen3-max"
  | "qwen3-max-thinking"
  | "qwen3-coder"
  | "qwen3-coder-plus"
  | "qwen3-coder-next"
  | "qwen3-coder:free"
  | "qwen3-235b-a22b"
  | "qwen3.5-plus-20260420"
  | "qwen3.5-397b-a17b"
  | "qwen3-vl-235b-a22b-instruct"
  | "qwen3-next-80b-a3b-instruct";

/** Modelos Kimi (Moonshot) via OpenRouter (prefixo `openrouter/moonshotai/`) */
export type MoonshotModels =
  | "kimi-k3"
  | "kimi-k2.7-code"
  | "kimi-k2.6"
  | "kimi-k2.6:free"
  | "kimi-k2.5"
  | "kimi-k2-thinking";

/** Modelos MiMo (Xiaomi) via OpenRouter (prefixo `openrouter/xiaomi/`) */
export type XiaomiModels =
  | "mimo-v2.5-pro"
  | "mimo-v2.5"
  | "mimo-v2-flash"
  | "mimo-v2-omni";

/** Modelos GLM (Zhipu/Z.ai) via OpenRouter (prefixo `openrouter/z-ai/`) */
export type ZAiModels =
  | "glm-5.3"
  | "glm-5.3-prime"
  | "glm-5.2"
  | "glm-5.1"
  | "glm-5"
  | "glm-5-turbo"
  | "glm-5-flash"
  | "glm-4.7"
  | "glm-4.7-flash";

/** Modelos MiniMax via OpenRouter (prefixo `openrouter/minimax/`) */
export type MiniMaxModels =
  | "minimax-m3"
  | "minimax-m2.7"
  | "minimax-m2.5:free";

export type OpenRouterProvidersModels =
  | `google/${GeminiModels}`
  | `openai/${ChatGPTModels}`
  | `anthropic/${AnthropicModels}`
  | `deepseek/${DeepSeekModels}`
  | `qwen/${QwenModels}`
  | `moonshotai/${MoonshotModels}`
  | `xiaomi/${XiaomiModels}`
  | `z-ai/${ZAiModels}`
  | `minimax/${MiniMaxModels}`;

export type OpenRouterModels = `openrouter/${OpenRouterProvidersModels}`;

/** Modelos via API nativa do Ollama (prefixo `ollama/`) */
export type OllamaModels = `ollama/${string}`;

/** Modelos via API compatível com OpenAI — LM Studio, Ollama `/v1`, vLLM, etc. (prefixo `local/`) */
export type LocalModels = `local/${string}`;

/**
 * União agregada dos modelos conhecidos, com escape hatch.
 *
 * Os providers acima (`ChatGPTModels`, `GeminiModels`, ...) continuam fechados e
 * estritos. Aqui, `(string & {})` mantém o autocomplete dos nomes listados sem
 * fechar a união — um modelo novo (ou um slug do OpenRouter que ainda não está
 * na lista) continua aceito sem exigir release da lib. O `& {}` evita que o
 * TypeScript colapse a união inteira para `string`.
 */
export type AIModelNames =
  | ChatGPTModels
  | GeminiModels
  | OpenRouterModels
  | OllamaModels
  | LocalModels
  | (string & {});
