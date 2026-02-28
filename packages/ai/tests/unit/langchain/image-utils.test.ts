import { describe, it, expect } from "vitest";
import { ImageUtils } from "../../../src/utils/image-utils";

describe("ImageUtils", () => {
  describe("bufferToBase64", () => {
    it("deve converter Buffer para base64", () => {
      const buffer = Buffer.from("test data");
      const result = ImageUtils.bufferToBase64(buffer);
      expect(result).toBe("dGVzdCBkYXRh");
    });

    it("deve converter ArrayBuffer para base64", () => {
      const arrayBuffer = new TextEncoder().encode("test data").buffer;
      const result = ImageUtils.bufferToBase64(arrayBuffer);
      expect(result).toBe("dGVzdCBkYXRh");
    });

    it("deve converter Uint8Array para base64", () => {
      const uint8Array = new TextEncoder().encode("test data");
      const result = ImageUtils.bufferToBase64(uint8Array);
      expect(result).toBe("dGVzdCBkYXRh");
    });

    it("deve lançar erro para tipo não suportado", () => {
      expect(() => {
        ImageUtils.bufferToBase64("invalid" as any);
      }).toThrow("Tipo de buffer não suportado");
    });
  });

  describe("detectMimeTypeFromExtension", () => {
    it("deve detectar JPEG pela extensão", () => {
      expect(ImageUtils.detectMimeTypeFromExtension("imagem.jpg")).toBe(
        "image/jpeg"
      );
      expect(ImageUtils.detectMimeTypeFromExtension("foto.jpeg")).toBe(
        "image/jpeg"
      );
      expect(ImageUtils.detectMimeTypeFromExtension("foto.JPG")).toBe(
        "image/jpeg"
      );
    });

    it("deve detectar PNG pela extensão", () => {
      expect(ImageUtils.detectMimeTypeFromExtension("imagem.png")).toBe(
        "image/png"
      );
    });

    it("deve detectar GIF pela extensão", () => {
      expect(ImageUtils.detectMimeTypeFromExtension("animacao.gif")).toBe(
        "image/gif"
      );
    });

    it("deve detectar WebP pela extensão", () => {
      expect(ImageUtils.detectMimeTypeFromExtension("foto.webp")).toBe(
        "image/webp"
      );
    });

    it("deve retornar null para extensão desconhecida", () => {
      expect(
        ImageUtils.detectMimeTypeFromExtension("arquivo.unknown")
      ).toBeNull();
    });

    it("deve retornar null quando filename não é fornecido", () => {
      expect(ImageUtils.detectMimeTypeFromExtension(undefined)).toBeNull();
    });
  });

  describe("detectMimeTypeFromBuffer", () => {
    it("deve detectar JPEG pelos magic bytes", () => {
      const buffer = Buffer.from([0xff, 0xd8, 0xff, 0x00, 0x00]);
      expect(ImageUtils.detectMimeTypeFromBuffer(buffer)).toBe("image/jpeg");
    });

    it("deve detectar PNG pelos magic bytes", () => {
      const buffer = Buffer.from([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00,
      ]);
      expect(ImageUtils.detectMimeTypeFromBuffer(buffer)).toBe("image/png");
    });

    it("deve detectar GIF pelos magic bytes", () => {
      const buffer = Buffer.from([0x47, 0x49, 0x46, 0x38, 0x00, 0x00]);
      expect(ImageUtils.detectMimeTypeFromBuffer(buffer)).toBe("image/gif");
    });

    it("deve detectar WebP pelos magic bytes", () => {
      const buffer = Buffer.from([
        0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50,
      ]);
      expect(ImageUtils.detectMimeTypeFromBuffer(buffer)).toBe("image/webp");
    });

    it("deve retornar null para buffer desconhecido", () => {
      const buffer = Buffer.from([0x00, 0x00, 0x00, 0x00]);
      expect(ImageUtils.detectMimeTypeFromBuffer(buffer)).toBeNull();
    });
  });

  describe("detectImageMimeType", () => {
    it("deve priorizar extensão sobre magic bytes", () => {
      const buffer = Buffer.from([0xff, 0xd8, 0xff]); // Magic bytes de JPEG
      const result = ImageUtils.detectImageMimeType(buffer, "imagem.png");
      expect(result).toBe("image/png");
    });

    it("deve usar magic bytes quando extensão não está disponível", () => {
      const buffer = Buffer.from([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00,
      ]);
      const result = ImageUtils.detectImageMimeType(buffer);
      expect(result).toBe("image/png");
    });

    it("deve usar fallback para JPEG quando não consegue detectar", () => {
      const buffer = Buffer.from([0x00, 0x00, 0x00, 0x00]);
      const result = ImageUtils.detectImageMimeType(buffer);
      expect(result).toBe("image/jpeg");
    });
  });
});
