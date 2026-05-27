type ChatGPTModels =
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
  | "gpt-chat-latest"
  | "o3"
  | "o4-mini";

type GeminiModels =
  | "gemini-2.5-flash"
  | "gemini-2.5-flash-lite"
  | "gemini-2.5-pro"
  | "gemini-3-flash"
  | "gemini-3-pro"
  | "gemini-3-flash-preview"
  | "gemini-3.5-flash"
  | "gemini-3.1-pro-preview"
  | "gemini-3.1-flash-lite";

type AnthropicModels =
  | "claude-opus-4.7"
  | "claude-opus-4.7-fast"
  | "claude-opus-4.6"
  | "claude-opus-4.6-fast"
  | "claude-opus-4.5"
  | "claude-sonnet-4.6"
  | "claude-sonnet-4.5"
  | "claude-haiku-4.5"
  | "claude-opus-4.1"
  | "claude-opus-4"
  | "claude-sonnet-4"
  | "claude-3.5-haiku"
  | "claude-3-haiku";

/** Modelos DeepSeek via OpenRouter (prefixo `openrouter/deepseek/`) */
type DeepSeekModels =
  | "deepseek-v4-pro"
  | "deepseek-v4-flash"
  | "deepseek-v4-flash:free"
  | "deepseek-chat"
  | "deepseek-chat-v3.1"
  | "deepseek-r1"
  | "deepseek-r1-0528"
  | "deepseek-v3.2"
  | "deepseek-v3.2-speciale"
  | "deepseek-v3.1-terminus";

/** Modelos Qwen via OpenRouter (prefixo `openrouter/qwen/`) */
type QwenModels =
  | "qwen3.7-max"
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
type MoonshotModels =
  | "kimi-k2.6"
  | "kimi-k2.6:free"
  | "kimi-k2.5"
  | "kimi-k2-thinking";

/** Modelos MiMo (Xiaomi) via OpenRouter (prefixo `openrouter/xiaomi/`) */
type XiaomiModels =
  | "mimo-v2.5-pro"
  | "mimo-v2.5"
  | "mimo-v2-flash"
  | "mimo-v2-omni";

/** Modelos GLM (Zhipu) via OpenRouter (prefixo `openrouter/z-ai/`) */
type ZAiModels = "glm-5" | "glm-4.7" | "glm-4.7-flash";

/** Modelos MiniMax via OpenRouter (prefixo `openrouter/minimax/`) */
type MiniMaxModels = "minimax-m2.7" | "minimax-m2.5:free";

type OpenRouterProvidersModels =
  | `google/${GeminiModels}`
  | `openai/${ChatGPTModels}`
  | `anthropic/${AnthropicModels}`
  | `deepseek/${DeepSeekModels}`
  | `qwen/${QwenModels}`
  | `moonshotai/${MoonshotModels}`
  | `xiaomi/${XiaomiModels}`
  | `z-ai/${ZAiModels}`
  | `minimax/${MiniMaxModels}`;

type OpenRouterModels = `openrouter/${OpenRouterProvidersModels}`;

export type AIModelNames = ChatGPTModels | GeminiModels | OpenRouterModels;
