import { describe, it, expect, vi, beforeEach } from "vitest";
import { embedGemini } from "../../../src/embeddings/embed-gemini.js";

const mockEmbedQuery = vi.fn();
const mockEmbedDocuments = vi.fn();

vi.mock("@langchain/google-genai", () => ({
  GoogleGenerativeAIEmbeddings: class MockGoogleGenerativeAIEmbeddings {
    constructor(public params: Record<string, unknown>) {}
    embedQuery = mockEmbedQuery;
    embedDocuments = mockEmbedDocuments;
  },
}));

describe("embed-gemini", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockEmbedQuery.mockResolvedValue([0.5, 0.6]);
    mockEmbedDocuments.mockResolvedValue([
      [0.1, 0.2],
      [0.3, 0.4],
    ]);
  });

  it("embedQuery para input único", async () => {
    const result = await embedGemini(
      "hello",
      { model: "gemini-embedding-001" },
      "gemini-key",
    );

    expect(result.embeddings).toEqual([[0.5, 0.6]]);
    expect(mockEmbedQuery).toHaveBeenCalledWith("hello");
  });

  it("embedDocuments para lote", async () => {
    const result = await embedGemini(
      ["a", "b"],
      { model: "gemini-embedding-001", taskType: "RETRIEVAL_DOCUMENT" },
      "gemini-key",
    );

    expect(result.embeddings).toHaveLength(2);
    expect(mockEmbedDocuments).toHaveBeenCalledWith(["a", "b"]);
  });

  it("exige googleGeminiToken", async () => {
    await expect(
      embedGemini("x", { model: "gemini-embedding-001" }),
    ).rejects.toThrow("googleGeminiToken");
  });
});
