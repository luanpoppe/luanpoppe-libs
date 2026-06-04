import { AIEmbeddings } from "../../src/index";
import "dotenv/config";

describe("AIEmbeddings E2E", () => {
  const openAIApiKey = process.env.OPENAI_API_KEY;
  const googleGeminiToken = process.env.GOOGLE_GEMINI_TOKEN;
  const openRouterApiKey = process.env.OPENROUTER_API_KEY;
  const timeout = 60_000;

  it(
    "OpenAI text-embedding-3-small",
    { timeout },
    async () => {
      if (!openAIApiKey) {
        console.log("OPENAI_API_KEY não configurada — pulando");
        return;
      }

      const result = await AIEmbeddings.embedOpenAI(
        "The quick brown fox jumps over the lazy dog.",
        { model: "text-embedding-3-small" },
        openAIApiKey,
      );

      expect(result.embeddings).toHaveLength(1);
      expect(result.embeddings[0]!.length).toBeGreaterThan(100);
    },
  );

  it(
    "Gemini gemini-embedding-001",
    { timeout },
    async () => {
      if (!googleGeminiToken) {
        console.log("GOOGLE_GEMINI_TOKEN não configurada — pulando");
        return;
      }

      const vector = await AIEmbeddings.embedQuery(
        "Semantic search test.",
        { model: "gemini-embedding-001" },
        { googleGeminiToken },
      );

      expect(vector.length).toBeGreaterThan(100);
    },
  );

  it(
    "OpenRouter openai/text-embedding-3-small",
    { timeout },
    async () => {
      if (!openRouterApiKey) {
        console.log("OPENROUTER_API_KEY não configurada — pulando");
        return;
      }

      const result = await AIEmbeddings.embedOpenRouter(
        ["First document.", "Second document."],
        { model: "openrouter/openai/text-embedding-3-small" },
        openRouterApiKey,
      );

      expect(result.embeddings).toHaveLength(2);
      expect(result.embeddings[0]!.length).toBeGreaterThan(100);
    },
  );

  it(
    "embedDocuments em lote via roteamento OpenAI",
    { timeout },
    async () => {
      if (!openAIApiKey) {
        console.log("OPENAI_API_KEY não configurada — pulando");
        return;
      }

      const vectors = await AIEmbeddings.embedDocuments(
        ["doc a", "doc b"],
        { model: "text-embedding-3-small" },
        { openAIApiKey },
      );

      expect(vectors).toHaveLength(2);
    },
  );
});
