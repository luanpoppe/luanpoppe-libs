import OpenAI from "openai";

export const OPENROUTER_API_BASE = "https://openrouter.ai/api/v1";

export function createOpenRouterOpenAIClient(apiKey: string): OpenAI {
  return new OpenAI({
    apiKey,
    baseURL: OPENROUTER_API_BASE,
  });
}
