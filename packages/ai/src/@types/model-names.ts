type ChatGPTModels =
  | "gpt-4"
  | "gpt-4o"
  | "gpt-4.1"
  | "gpt-5"
  | "gpt-5.1"
  | "gpt-5-mini"
  | "gpt-5-nano";

type GeminiModels =
  | "gemini-2.5-flash"
  | "gemini-2.5-pro"
  | "gemini-3-flash"
  | "gemini-3-pro";

type AnthropicModels = "claude-opus-4.5"
  | "claude-haiku-4.5"
  | "claude-sonnet-4.5"
  | "claude-opus-4.1"
  | "claude-opus-4"
  | "claude-sonnet-4";

type OpenRouterProvidersModels =
  | `google/${GeminiModels}`
  | `openai/${ChatGPTModels}`
  | `anthropic/${AnthropicModels}`

type OpenRouterModels = `openrouter/${OpenRouterProvidersModels}`;

export type AIModelNames = ChatGPTModels | GeminiModels | OpenRouterModels;
