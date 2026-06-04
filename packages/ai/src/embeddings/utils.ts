export function normalizeInput(input: string | string[]): string[] {
  return Array.isArray(input) ? input : [input];
}

export function stripOpenRouterPrefix(model: string): string {
  return model.startsWith("openrouter/")
    ? model.slice("openrouter/".length)
    : model;
}

export function isOpenAIEmbeddingModel(model: string): boolean {
  return model.startsWith("text-embedding-");
}

export function isGeminiEmbeddingModel(model: string): boolean {
  return model.startsWith("gemini-embedding-");
}

export function isOpenRouterEmbeddingModel(model: string): boolean {
  return model.startsWith("openrouter/");
}
