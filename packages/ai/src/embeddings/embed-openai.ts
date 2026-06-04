import OpenAI from "openai";
import type { OpenAIEmbeddingOptions, EmbeddingResult } from "./types";
import { normalizeInput } from "./utils";

function createOpenAIClient(apiKey?: string): OpenAI {
  if (!apiKey) {
    throw new Error("OpenAI API key is not passed in the embedding parameters");
  }
  return new OpenAI({ apiKey });
}

function mapEmbeddingResponse(
  response: OpenAI.CreateEmbeddingResponse,
  model: string,
): EmbeddingResult {
  const embeddings = response.data
    .sort((a, b) => a.index - b.index)
    .map((item) => item.embedding as number[]);

  const result: EmbeddingResult = {
    embeddings,
    model: response.model ?? model,
  };

  if (response.usage) {
    result.usage = {
      prompt_tokens: response.usage.prompt_tokens,
      total_tokens: response.usage.total_tokens,
    };
  }

  return result;
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
