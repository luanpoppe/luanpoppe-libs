import { describe, it, expect, vi, beforeEach } from "vitest";
import { transcribeOpenRouter } from "../../../src/audio/transcription-openrouter.js";

const mockFetch = vi.fn();

vi.stubGlobal("fetch", mockFetch);

describe("transcription-openrouter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        text: "transcrito via OR",
        usage: { seconds: 2, cost: 0.001 },
      }),
    });
  });

  it("envia input_audio base64 e model", async () => {
    const buf = Buffer.from("fake-audio");
    const result = await transcribeOpenRouter(
      buf,
      { model: "openai/whisper-1", format: "mp3", language: "pt" },
      "or-key",
    );

    expect(result.text).toBe("transcrito via OR");
    expect(mockFetch).toHaveBeenCalledWith(
      "https://openrouter.ai/api/v1/audio/transcriptions",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer or-key",
        }),
      }),
    );

    const body = JSON.parse(
      (mockFetch.mock.calls[0][1] as RequestInit).body as string,
    );
    expect(body.model).toBe("openai/whisper-1");
    expect(body.input_audio.format).toBe("mp3");
    expect(body.input_audio.data).toBe(buf.toString("base64"));
    expect(body.language).toBe("pt");
  });

  it("aplica provider default deepseek para modelos deepseek", async () => {
    await transcribeOpenRouter(
      Buffer.from("x"),
      { model: "deepseek/some-stt" },
      "or-key",
    );

    const body = JSON.parse(
      (mockFetch.mock.calls[0][1] as RequestInit).body as string,
    );
    expect(body.provider).toEqual({ only: ["deepseek"] });
  });

  it("exige openRouterApiKey", async () => {
    await expect(
      transcribeOpenRouter(Buffer.from("x"), { model: "openai/whisper-1" }),
    ).rejects.toThrow("OpenRouter API key");
  });

  it("propaga erro HTTP", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 400,
      text: async () => "bad request",
    });

    await expect(
      transcribeOpenRouter(
        Buffer.from("x"),
        { model: "openai/whisper-1" },
        "or-key",
      ),
    ).rejects.toThrow("OpenRouter STT falhou");
  });
});
