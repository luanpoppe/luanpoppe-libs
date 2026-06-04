import { describe, it, expect, vi, beforeEach } from "vitest";
import { embedOpenAI } from "../../../src/embeddings/embed-openai.js";

const mockEmbeddingsCreate = vi.fn();

vi.mock("openai", () => ({
  default: class MockOpenAI {
    embeddings = { create: mockEmbeddingsCreate };
  },
}));

describe("embed-openai", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockEmbeddingsCreate.mockResolvedValue({
      model: "text-embedding-3-small",
      data: [
        { index: 0, embedding: [0.1, 0.2] },
        { index: 1, embedding: [0.3, 0.4] },
      ],
      usage: { prompt_tokens: 10, total_tokens: 10 },
    });
  });

  it("cria embeddings para string única", async () => {
    mockEmbeddingsCreate.mockResolvedValueOnce({
      model: "text-embedding-3-small",
      data: [{ index: 0, embedding: [0.1, 0.2] }],
      usage: { prompt_tokens: 5, total_tokens: 5 },
    });

    const result = await embedOpenAI(
      "hello",
      { model: "text-embedding-3-small" },
      "sk-test",
    );

    expect(result.embeddings).toEqual([[0.1, 0.2]]);
    expect(mockEmbeddingsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "text-embedding-3-small",
        input: "hello",
      }),
    );
  });

  it("cria embeddings em lote", async () => {
    const result = await embedOpenAI(
      ["a", "b"],
      { model: "text-embedding-3-large", dimensions: 256 },
      "sk-test",
    );

    expect(result.embeddings).toHaveLength(2);
    expect(mockEmbeddingsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        input: ["a", "b"],
        dimensions: 256,
      }),
    );
  });

  it("exige API key", async () => {
    await expect(
      embedOpenAI("x", { model: "text-embedding-3-small" }),
    ).rejects.toThrow("OpenAI API key");
  });
});
