import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import type { EmbeddingResult, GeminiEmbeddingOptions } from "./types";
import { normalizeInput } from "./utils";

export async function embedGemini(
  input: string | string[],
  options: GeminiEmbeddingOptions,
  googleGeminiToken?: string,
): Promise<EmbeddingResult> {
  if (!googleGeminiToken) {
    throw new Error(
      "googleGeminiToken é obrigatório para embedGemini.",
    );
  }

  const texts = normalizeInput(input);
  const modelParams: ConstructorParameters<typeof GoogleGenerativeAIEmbeddings>[0] =
    {
      apiKey: googleGeminiToken,
      model: options.model,
    };
  if (options.taskType) {
    modelParams.taskType = options.taskType as NonNullable<
      typeof modelParams.taskType
    >;
  }

  const embeddingsModel = new GoogleGenerativeAIEmbeddings(modelParams);

  const embeddings =
    texts.length === 1
      ? [await embeddingsModel.embedQuery(texts[0]!)]
      : await embeddingsModel.embedDocuments(texts);

  const result: EmbeddingResult = {
    embeddings,
    model: options.model,
  };

  if (options.dimensions !== undefined && options.model === "gemini-embedding-001") {
    result.embeddings = result.embeddings.map((vec) =>
      truncateAndNormalizeL2(vec, options.dimensions!),
    );
  }

  return result;
}

function truncateAndNormalizeL2(vector: number[], dimensions: number): number[] {
  const truncated = vector.slice(0, dimensions);
  const norm = Math.sqrt(truncated.reduce((sum, v) => sum + v * v, 0));
  if (norm === 0) return truncated;
  return truncated.map((v) => v / norm);
}
