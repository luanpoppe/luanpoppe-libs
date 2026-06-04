import { describe, it, expect, vi, beforeEach } from "vitest";
import { speakOpenAI } from "../../../src/audio/speech-openai.js";

const mockSpeechCreate = vi.fn();

vi.mock("openai", () => ({
  default: class MockOpenAI {
    audio = {
      speech: {
        create: mockSpeechCreate,
      },
    };
  },
}));

describe("speech-openai", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSpeechCreate.mockResolvedValue({
      arrayBuffer: async () => new Uint8Array([1, 2, 3]).buffer,
    });
  });

  it("cria speech com voice e model padrão", async () => {
    const result = await speakOpenAI(
      "Olá",
      { voice: "nova" },
      "sk-test",
    );

    expect(result.audio).toEqual(Buffer.from([1, 2, 3]));
    expect(result.contentType).toBe("audio/mpeg");
    expect(mockSpeechCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "gpt-4o-mini-tts",
        voice: "nova",
        input: "Olá",
        response_format: "mp3",
      }),
    );
  });

  it("repassa instructions para gpt-4o-mini-tts", async () => {
    await speakOpenAI(
      "Oi",
      {
        voice: "alloy",
        model: "gpt-4o-mini-tts",
        instructions: "Fale devagar.",
      },
      "sk-test",
    );

    expect(mockSpeechCreate).toHaveBeenCalledWith(
      expect.objectContaining({ instructions: "Fale devagar." }),
    );
  });

  it("rejeita instructions em tts-1", async () => {
    await expect(
      speakOpenAI(
        "Oi",
        { voice: "alloy", model: "tts-1", instructions: "x" },
        "sk-test",
      ),
    ).rejects.toThrow("instructions");
  });

  it("exige API key", async () => {
    await expect(speakOpenAI("Oi", { voice: "nova" })).rejects.toThrow(
      "OpenAI API key",
    );
  });
});
