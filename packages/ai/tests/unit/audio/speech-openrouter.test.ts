import { describe, it, expect, vi, beforeEach } from "vitest";
import { speakOpenRouter } from "../../../src/audio/speech-openrouter.js";

const mockSpeechCreate = vi.fn();
let capturedBaseURL: string | undefined;

vi.mock("../../../src/audio/openrouter-client.js", () => ({
  createOpenRouterOpenAIClient: (apiKey: string) => {
    capturedBaseURL = "https://openrouter.ai/api/v1";
    return {
      apiKey,
      audio: {
        speech: { create: mockSpeechCreate },
      },
    };
  },
}));

describe("speech-openrouter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    capturedBaseURL = undefined;
    mockSpeechCreate.mockResolvedValue({
      arrayBuffer: async () => new Uint8Array([9, 8]).buffer,
    });
  });

  it("cria speech com model slug e voice", async () => {
    const result = await speakOpenRouter(
      "Resumo",
      {
        model: "google/gemini-2.5-flash-preview-tts",
        voice: "Kore",
        responseFormat: "mp3",
      },
      "or-key",
    );

    expect(result.audio).toEqual(Buffer.from([9, 8]));
    expect(mockSpeechCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "google/gemini-2.5-flash-preview-tts",
        voice: "Kore",
        input: "Resumo",
      }),
    );
  });

  it("mescla instructions em provider.options sem apagar only", async () => {
    await speakOpenRouter(
      "Oi",
      {
        model: "deepseek/some-tts",
        voice: "alloy",
        instructions: "Tom formal.",
      },
      "or-key",
    );

    const body = mockSpeechCreate.mock.calls[0][0] as Record<string, unknown>;
    const provider = body.provider as Record<string, unknown>;
    expect(provider.only).toEqual(["deepseek"]);
    expect(provider.options).toEqual({
      openai: { instructions: "Tom formal." },
    });
  });

  it("usa pcm por padrão para modelos Gemini TTS", async () => {
    await speakOpenRouter(
      "Oi",
      {
        model: "google/gemini-3.1-flash-tts-preview",
        voice: "Kore",
      },
      "or-key",
    );

    expect(mockSpeechCreate).toHaveBeenCalledWith(
      expect.objectContaining({ response_format: "pcm" }),
    );
  });

  it("exige model e voice", async () => {
    await expect(
      speakOpenRouter("x", { model: "", voice: "a" }, "k"),
    ).rejects.toThrow("model é obrigatório");
  });
});
