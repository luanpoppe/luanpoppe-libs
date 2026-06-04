import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  transcribeDetailedOpenAI,
  transcribeToSrtOpenAI,
  transcribeToVttOpenAI,
  transcribeDiarizedOpenAI,
  translateOpenAI,
  transcribeWithWhisperOpenAI,
} from "../../../src/audio/transcription-openai.js";

const mockTranscriptionsCreate = vi.fn();
const mockTranslationsCreate = vi.fn();

vi.mock("openai", () => ({
  default: class MockOpenAI {
    audio = {
      transcriptions: { create: mockTranscriptionsCreate },
      translations: { create: mockTranslationsCreate },
    };
  },
  toFile: async (buffer: Buffer, filename: string) =>
    new File([new Uint8Array(buffer)], filename, { type: "audio/mpeg" }),
}));

describe("transcription-openai", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("transcribeDetailedOpenAI mapeia verbose_json com words", async () => {
    mockTranscriptionsCreate.mockResolvedValue({
      text: "olá",
      language: "pt",
      duration: 1.2,
      words: [{ word: "olá", start: 0, end: 0.5 }],
      segments: [{ id: 0, start: 0, end: 0.5, text: "olá" }],
    });

    const result = await transcribeDetailedOpenAI(
      Buffer.from("audio"),
      {
        model: "whisper-1",
        responseFormat: "verbose_json",
        timestampGranularities: ["word"],
      },
      "sk-test",
    );

    expect(result.text).toBe("olá");
    expect(result.words).toHaveLength(1);
    expect(result.segments).toHaveLength(1);
  });

  it("transcribeToSrtOpenAI usa response_format srt", async () => {
    mockTranscriptionsCreate.mockResolvedValue("1\n00:00:00,000 --> 00:00:01,000\nolá");

    const srt = await transcribeToSrtOpenAI(
      Buffer.from("audio"),
      { languageIn2Digits: "pt" },
      "sk-test",
    );

    expect(srt).toContain("olá");
    expect(mockTranscriptionsCreate).toHaveBeenCalledWith(
      expect.objectContaining({ response_format: "srt", model: "whisper-1" }),
    );
  });

  it("transcribeToVttOpenAI usa response_format vtt", async () => {
    mockTranscriptionsCreate.mockResolvedValue("WEBVTT\n\n00:00:00.000 --> 00:00:01.000\nolá");

    const vtt = await transcribeToVttOpenAI(Buffer.from("audio"), {}, "sk-test");

    expect(vtt).toContain("WEBVTT");
    expect(mockTranscriptionsCreate).toHaveBeenCalledWith(
      expect.objectContaining({ response_format: "vtt" }),
    );
  });

  it("transcribeDiarizedOpenAI mapeia speakers", async () => {
    mockTranscriptionsCreate.mockResolvedValue({
      text: "fala a fala b",
      segments: [
        { speaker: "A", start: 0, end: 1, text: "fala a" },
        { speaker: "B", start: 1, end: 2, text: "fala b" },
      ],
    });

    const result = await transcribeDiarizedOpenAI(Buffer.from("audio"), {}, "sk-test");

    expect(result.speakers).toHaveLength(2);
    expect(result.speakers?.[0].speaker).toBe("A");
    expect(mockTranscriptionsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "gpt-4o-transcribe-diarize",
        response_format: "diarized_json",
      }),
    );
  });

  it("translateOpenAI chama translations.create", async () => {
    mockTranslationsCreate.mockResolvedValue({ text: "hello" });

    const text = await translateOpenAI(Buffer.from("audio"), {}, "sk-test");

    expect(text).toBe("hello");
    expect(mockTranslationsCreate).toHaveBeenCalled();
  });

  it("rejeita timestampGranularities fora de whisper-1 verbose_json", async () => {
    await expect(
      transcribeDetailedOpenAI(Buffer.from("x"), {
        model: "gpt-4o-transcribe",
        responseFormat: "json",
        timestampGranularities: ["word"],
      }),
    ).rejects.toThrow("timestampGranularities");
  });

  it("transcribeWithWhisperOpenAI retorna string", async () => {
    mockTranscriptionsCreate.mockResolvedValue("texto simples");

    const text = await transcribeWithWhisperOpenAI(Buffer.from("audio"), {}, "sk-test");

    expect(text).toBe("texto simples");
    expect(mockTranscriptionsCreate).toHaveBeenCalledWith(
      expect.objectContaining({ response_format: "text" }),
    );
  });
});
