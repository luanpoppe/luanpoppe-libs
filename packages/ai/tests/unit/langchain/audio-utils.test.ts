import { describe, it, expect } from "vitest";
import { AudioUtils } from "../../../src/utils/audio-utils";

describe("AudioUtils", () => {
  describe("bufferToBase64", () => {
    it("deve converter Buffer para base64", () => {
      const buffer = Buffer.from("test data");
      const result = AudioUtils.bufferToBase64(buffer);
      expect(result).toBe("dGVzdCBkYXRh");
    });

    it("deve converter ArrayBuffer para base64", () => {
      const arrayBuffer = new TextEncoder().encode("test data").buffer;
      const result = AudioUtils.bufferToBase64(arrayBuffer);
      expect(result).toBe("dGVzdCBkYXRh");
    });

    it("deve converter Uint8Array para base64", () => {
      const uint8Array = new TextEncoder().encode("test data");
      const result = AudioUtils.bufferToBase64(uint8Array);
      expect(result).toBe("dGVzdCBkYXRh");
    });

    it("deve lançar erro para tipo não suportado", () => {
      expect(() => {
        AudioUtils.bufferToBase64("invalid" as any);
      }).toThrow("Tipo de buffer não suportado");
    });
  });

  describe("detectMimeTypeFromExtension", () => {
    it("deve detectar MP3 pela extensão", () => {
      expect(AudioUtils.detectMimeTypeFromExtension("audio.mp3")).toBe(
        "audio/mp3"
      );
      expect(AudioUtils.detectMimeTypeFromExtension("audio.MP3")).toBe(
        "audio/mp3"
      );
    });

    it("deve detectar WAV pela extensão", () => {
      expect(AudioUtils.detectMimeTypeFromExtension("audio.wav")).toBe(
        "audio/wav"
      );
    });

    it("deve detectar MP4 pela extensão", () => {
      expect(AudioUtils.detectMimeTypeFromExtension("audio.mp4")).toBe(
        "audio/mp4"
      );
      expect(AudioUtils.detectMimeTypeFromExtension("audio.m4a")).toBe(
        "audio/m4a"
      );
    });

    it("deve detectar WebM pela extensão", () => {
      expect(AudioUtils.detectMimeTypeFromExtension("audio.webm")).toBe(
        "audio/webm"
      );
    });

    it("deve retornar null para extensão desconhecida", () => {
      expect(
        AudioUtils.detectMimeTypeFromExtension("audio.unknown")
      ).toBeNull();
    });

    it("deve retornar null quando filename não é fornecido", () => {
      expect(AudioUtils.detectMimeTypeFromExtension(undefined)).toBeNull();
    });
  });

  describe("detectMimeTypeFromBuffer", () => {
    it("deve detectar MP3 pelos magic bytes (ID3)", () => {
      const buffer = Buffer.from([0x49, 0x44, 0x33, 0x03, 0x00]);
      expect(AudioUtils.detectMimeTypeFromBuffer(buffer)).toBe("audio/mp3");
    });

    it("deve detectar MP3 pelos magic bytes (FF FB)", () => {
      const buffer = Buffer.from([0xff, 0xfb, 0x90, 0x00]);
      expect(AudioUtils.detectMimeTypeFromBuffer(buffer)).toBe("audio/mp3");
    });

    it("deve detectar WAV pelos magic bytes", () => {
      const buffer = Buffer.from([
        0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x41, 0x56, 0x45,
      ]);
      expect(AudioUtils.detectMimeTypeFromBuffer(buffer)).toBe("audio/wav");
    });

    it("deve detectar MP4 pelos magic bytes", () => {
      const buffer = Buffer.from([
        0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6f, 0x6d,
      ]);
      expect(AudioUtils.detectMimeTypeFromBuffer(buffer)).toBe("audio/mp4");
    });

    it("deve detectar WebM pelos magic bytes", () => {
      const buffer = Buffer.from([0x1a, 0x45, 0xdf, 0xa3]);
      expect(AudioUtils.detectMimeTypeFromBuffer(buffer)).toBe("audio/webm");
    });

    it("deve detectar OGG pelos magic bytes", () => {
      const buffer = Buffer.from([0x4f, 0x67, 0x67, 0x53]);
      expect(AudioUtils.detectMimeTypeFromBuffer(buffer)).toBe("audio/ogg");
    });

    it("deve detectar FLAC pelos magic bytes", () => {
      const buffer = Buffer.from([0x66, 0x4c, 0x61, 0x43]);
      expect(AudioUtils.detectMimeTypeFromBuffer(buffer)).toBe("audio/flac");
    });

    it("deve retornar null para buffer desconhecido", () => {
      const buffer = Buffer.from([0x00, 0x00, 0x00, 0x00]);
      expect(AudioUtils.detectMimeTypeFromBuffer(buffer)).toBeNull();
    });
  });

  describe("detectAudioMimeType", () => {
    it("deve priorizar extensão sobre magic bytes", () => {
      const buffer = Buffer.from([0x49, 0x44, 0x33]); // Magic bytes de MP3
      const result = AudioUtils.detectAudioMimeType(buffer, "audio.wav");
      expect(result).toBe("audio/wav"); // Extensão tem prioridade
    });

    it("deve usar magic bytes quando extensão não está disponível", () => {
      const buffer = Buffer.from([0x49, 0x44, 0x33, 0x03, 0x00]);
      const result = AudioUtils.detectAudioMimeType(buffer);
      expect(result).toBe("audio/mp3");
    });

    it("deve usar fallback para MP3 quando não consegue detectar", () => {
      const buffer = Buffer.from([0x00, 0x00, 0x00, 0x00]);
      const result = AudioUtils.detectAudioMimeType(buffer);
      expect(result).toBe("audio/mp3"); // Fallback
    });
  });
});
