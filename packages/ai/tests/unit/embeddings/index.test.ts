import { describe, it, expect, vi } from "vitest";
import {
  AIEmbeddings,
  ANTHROPIC_NO_NATIVE_EMBEDDINGS,
} from "../../../src/index.js";

vi.mock("../../../src/embeddings/embed-openai.js", () => ({
  embedOpenAI: vi.fn().mockResolvedValue({
    embeddings: [[1]],
    model: "text-embedding-3-small",
  }),
}));

vi.mock("../../../src/embeddings/embed-openrouter.js", () => ({
  embedOpenRouter: vi.fn().mockResolvedValue({
    embeddings: [[2]],
    model: "openai/text-embedding-3-small",
  }),
}));

vi.mock("../../../src/embeddings/embed-gemini.js", () => ({
  embedGemini: vi.fn().mockResolvedValue({
    embeddings: [[3]],
    model: "gemini-embedding-001",
  }),
}));

describe("AIEmbeddings facade", () => {
  it("expõe métodos estáticos", () => {
    expect(typeof AIEmbeddings.embedOpenAI).toBe("function");
    expect(typeof AIEmbeddings.embedOpenRouter).toBe("function");
    expect(typeof AIEmbeddings.embedGemini).toBe("function");
    expect(typeof AIEmbeddings.embedDocuments).toBe("function");
    expect(typeof AIEmbeddings.embedQuery).toBe("function");
  });

  it("exporta constante Anthropic", () => {
    expect(ANTHROPIC_NO_NATIVE_EMBEDDINGS).toContain("Anthropic");
  });

  it("embedQuery roteia por prefixo openrouter/", async () => {
    const { embedOpenRouter } = await import(
      "../../../src/embeddings/embed-openrouter.js"
    );

    const vec = await AIEmbeddings.embedQuery(
      "q",
      { model: "openrouter/openai/text-embedding-3-small" },
      { openRouterApiKey: "k" },
    );

    expect(vec).toEqual([2]);
    expect(embedOpenRouter).toHaveBeenCalled();
  });
});
