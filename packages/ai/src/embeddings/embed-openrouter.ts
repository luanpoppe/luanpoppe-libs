import type OpenAI from "openai";
import { resolveOpenRouterProvider } from "../langchain/models";
import { createOpenRouterOpenAIClient } from "../utils/openrouter-client";
import type { EmbeddingResult, OpenRouterEmbeddingOptions } from "./types";
import {
  mapEmbeddingResponse,
  normalizeInput,
  stripOpenRouterPrefix,
} from "./utils";

export async function embedOpenRouter(
  input: string | string[],
  options: OpenRouterEmbeddingOptions,
  openRouterApiKey?: string,
): Promise<EmbeddingResult> {
  if (!openRouterApiKey) {
    throw new Error(
      "OpenRouter API key is not passed in the embedding parameters",
    );
  }

  const openRouterModel = stripOpenRouterPrefix(options.model);
  const client = createOpenRouterOpenAIClient(openRouterApiKey);
  const texts = normalizeInput(input);

  const provider = resolveOpenRouterProvider(openRouterModel, {
    openRouterProvider: options.openRouterProvider,
    openRouterAllowAllProviders: options.openRouterAllowAllProviders,
  });

  const body: Record<string, unknown> = {
    model: openRouterModel,
    input: texts.length === 1 ? texts[0]! : texts,
  };

  if (options.dimensions !== undefined) body.dimensions = options.dimensions;
  if (options.encodingFormat) body.encoding_format = options.encodingFormat;
  if (provider) body.provider = provider;

  const response = await client.embeddings.create(
    body as unknown as OpenAI.EmbeddingCreateParams,
  );

  return mapEmbeddingResponse(response, openRouterModel);
}
