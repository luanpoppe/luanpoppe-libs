import { describe, it, expect, vi, beforeEach } from "vitest";
import { embedOpenRouter } from "../../../src/embeddings/embed-openrouter.js";

const mockEmbeddingsCreate = vi.fn();

vi.mock("../../../src/utils/openrouter-client.js", () => ({
  createOpenRouterOpenAIClient: () => ({
    embeddings: { create: mockEmbeddingsCreate },
  }),
}));

describe("embed-openrouter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockEmbeddingsCreate.mockResolvedValue({
      model: "openai/text-embedding-3-small",
      data: [{ index: 0, embedding: [1, 2, 3] }],
      usage: { prompt_tokens: 5, total_tokens: 5 },
    });
  });

  it("remove prefixo openrouter/ do model", async () => {
    const result = await embedOpenRouter(
      "test",
      { model: "openrouter/openai/text-embedding-3-small" },
      "or-key",
    );

    expect(result.embeddings[0]).toEqual([1, 2, 3]);
    expect(mockEmbeddingsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "openai/text-embedding-3-small",
        input: "test",
      }),
    );
  });

  it("repassa provider quando informado", async () => {
    await embedOpenRouter(
      "test",
      {
        model: "openrouter/openai/text-embedding-3-small",
        openRouterProvider: { sort: "price" },
      },
      "or-key",
    );

    expect(mockEmbeddingsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: { sort: "price" },
      }),
    );
  });

  it("exige openRouterApiKey", async () => {
    await expect(
      embedOpenRouter("x", {
        model: "openrouter/openai/text-embedding-3-small",
      }),
    ).rejects.toThrow("OpenRouter API key");
  });
});
