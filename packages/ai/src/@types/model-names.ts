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

export type AIModelNames = ChatGPTModels | GeminiModels;
