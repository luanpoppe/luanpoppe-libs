import { describe, it, expect, vi, beforeEach } from "vitest";
import { LangchainAudioTranscription } from "../../../src/langchain/audio-transcription.js";
import * as fs from "fs";

const mockTranscriptionsCreate = vi.fn().mockResolvedValue({
  text: "Texto transcrito do áudio",
});

vi.mock("openai", () => {
  return {
    default: class MockOpenAI {
      audio = {
        transcriptions: {
          create: mockTranscriptionsCreate,
        },
      };
    },
    toFile: async (buffer: Buffer, filename: string) => {
      return new File([new Uint8Array(buffer)], filename, {
        type: "audio/mpeg",
      });
    },
  };
});

vi.mock("fs", () => {
  const actualFs = require("fs");
  return {
    ...actualFs,
    existsSync: vi.fn((filePath: string) => {
      return actualFs.existsSync(filePath) || filePath.startsWith("/path/to/");
    }),
    readFileSync: vi.fn((filePath: string) => {
      if (actualFs.existsSync(filePath)) {
        return actualFs.readFileSync(filePath);
      }
      return Buffer.from("fake audio data");
    }),
  };
});

describe("LangchainAudioTranscription", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTranscriptionsCreate.mockResolvedValue({
      text: "Texto transcrito do áudio",
    });
  });

  describe("transcribeWithWhisper", () => {
    it("deve transcrever áudio usando Whisper", async () => {
      const audioBuffer = Buffer.from("fake audio data");

      const result = await LangchainAudioTranscription.transcribeWithWhisper(
        audioBuffer
      );

      expect(result).toBe("Texto transcrito do áudio");
      expect(mockTranscriptionsCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: "whisper-1",
          response_format: "text",
        })
      );
    });

    it("deve aceitar opções de transcrição", async () => {
      const audioBuffer = Buffer.from("fake audio data");

      await LangchainAudioTranscription.transcribeWithWhisper(audioBuffer, {
        languageIn2Digits: "pt",
        responseFormat: "json",
      });

      expect(mockTranscriptionsCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          language: "pt",
          response_format: "json",
        })
      );
    });

    it("deve aceitar modelo customizado", async () => {
      const audioBuffer = Buffer.from("fake audio data");

      await LangchainAudioTranscription.transcribeWithWhisper(audioBuffer, {
        model: "gpt-4o-transcribe",
      });

      expect(mockTranscriptionsCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: "gpt-4o-transcribe",
        })
      );
    });

    it("deve usar whisper-1 como padrão quando model não é informado", async () => {
      const audioBuffer = Buffer.from("fake audio data");

      await LangchainAudioTranscription.transcribeWithWhisper(audioBuffer);

      expect(mockTranscriptionsCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: "whisper-1",
        })
      );
    });

    it("deve aceitar formato de áudio nas opções (extensão)", async () => {
      const audioBuffer = Buffer.from("fake wav audio data");

      const result = await LangchainAudioTranscription.transcribeWithWhisper(
        audioBuffer,
        { format: "wav" }
      );

      expect(result).toBe("Texto transcrito do áudio");
      expect(mockTranscriptionsCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          file: expect.anything(),
        })
      );
      const createCall = mockTranscriptionsCreate.mock.calls[0]?.[0];
      expect(createCall?.file).toBeDefined();
      const file = createCall?.file as { name?: string };
      expect(file?.name).toMatch(/\.wav$/);
    });

    it("deve aceitar MIME type como formato", async () => {
      const audioBuffer = Buffer.from("fake webm audio data");

      const result = await LangchainAudioTranscription.transcribeWithWhisper(
        audioBuffer,
        { format: "audio/webm" }
      );

      expect(result).toBe("Texto transcrito do áudio");
      const createCall = mockTranscriptionsCreate.mock.calls[0]?.[0];
      const file = createCall?.file as { name?: string };
      expect(file?.name).toMatch(/\.webm$/);
    });

    it("deve propagar erro da API", async () => {
      mockTranscriptionsCreate.mockRejectedValueOnce(
        new Error("Erro de transcrição")
      );

      const audioBuffer = Buffer.from("fake audio data");

      await expect(
        LangchainAudioTranscription.transcribeWithWhisper(audioBuffer)
      ).rejects.toThrow("Erro de transcrição");
    });
  });

  describe("transcribeFileWithWhisper", () => {
    it("deve transcrever arquivo usando Whisper", async () => {
      const filePath = "/path/to/audio.mp3";

      const result =
        await LangchainAudioTranscription.transcribeFileWithWhisper(filePath);

      expect(result).toBe("Texto transcrito do áudio");
      expect(vi.mocked(fs.readFileSync)).toHaveBeenCalledWith(filePath);
      expect(mockTranscriptionsCreate).toHaveBeenCalled();
    });

    it("deve extrair formato da extensão do arquivo quando format não é informado", async () => {
      const filePath = "/path/to/audio.wav";

      const result =
        await LangchainAudioTranscription.transcribeFileWithWhisper(filePath);

      expect(result).toBe("Texto transcrito do áudio");
      const createCall = mockTranscriptionsCreate.mock.calls[0]?.[0];
      const file = createCall?.file as { name?: string };
      expect(file?.name).toMatch(/\.wav$/);
    });

    it("deve lançar erro se arquivo não existir", async () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);

      await expect(
        LangchainAudioTranscription.transcribeFileWithWhisper(
          "/nonexistent.mp3"
        )
      ).rejects.toThrow("Arquivo não encontrado");
    });
  });
});
