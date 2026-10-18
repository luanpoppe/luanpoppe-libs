import OpenAI from "openai";
import type { OpenAIEmbeddingOptions, EmbeddingResult } from "./types";
import { mapEmbeddingResponse, normalizeInput } from "./utils";

function createOpenAIClient(apiKey?: string): OpenAI {
  if (!apiKey) {
    throw new Error("OpenAI API key is not passed in the embedding parameters");
  }
  return new OpenAI({ apiKey });
}

export async function embedOpenAI(
  input: string | string[],
  options: OpenAIEmbeddingOptions,
  openAIApiKey?: string,
): Promise<EmbeddingResult> {
  const openai = createOpenAIClient(openAIApiKey);
  const texts = normalizeInput(input);

  const response = await openai.embeddings.create({
    model: options.model,
    input: texts.length === 1 ? texts[0]! : texts,
    ...(options.dimensions !== undefined ? { dimensions: options.dimensions } : {}),
    ...(options.encodingFormat
      ? { encoding_format: options.encodingFormat }
      : {}),
  });

  return mapEmbeddingResponse(response, options.model);
}
