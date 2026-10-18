import type OpenAI from "openai";
import type { EmbeddingResult } from "./types";

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

/**
 * Normaliza a resposta de `embeddings.create` (OpenAI e OpenRouter têm o mesmo
 * shape). Compartilhado para não duplicar o mapeamento nos dois módulos.
 */
export function mapEmbeddingResponse(
  response: OpenAI.CreateEmbeddingResponse,
  fallbackModel: string,
): EmbeddingResult {
  const embeddings = response.data
    .sort((a, b) => a.index - b.index)
    .map((item) => item.embedding as number[]);

  const result: EmbeddingResult = {
    embeddings,
    model: response.model ?? fallbackModel,
  };

  if (response.usage) {
    result.usage = {
      prompt_tokens: response.usage.prompt_tokens,
      total_tokens: response.usage.total_tokens,
    };
  }

  return result;
}
