import type { ImageBuffer, ImageMimeType } from "../@types/image";

export class ImageUtils {
  static bufferToBase64(buffer: ImageBuffer): string {
    if (buffer instanceof Buffer) {
      return buffer.toString("base64");
    }

    if (buffer instanceof ArrayBuffer) {
      const uint8Array = new Uint8Array(buffer);
      return Buffer.from(uint8Array).toString("base64");
    }

    if (buffer instanceof Uint8Array) {
      return Buffer.from(buffer).toString("base64");
    }

    throw new Error("Tipo de buffer não suportado");
  }

  static detectMimeTypeFromExtension(filename?: string): ImageMimeType | null {
    if (!filename) {
      return null;
    }

    const extension = filename.toLowerCase().split(".").pop();

    const mimeTypeMap: Record<string, ImageMimeType> = {
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      gif: "image/gif",
      webp: "image/webp",
    };

    return extension ? mimeTypeMap[extension] ?? null : null;
  }

  static detectMimeTypeFromBuffer(buffer: ImageBuffer): ImageMimeType | null {
    let bytes: Uint8Array;

    if (buffer instanceof Buffer) {
      bytes = new Uint8Array(buffer.slice(0, 16));
    } else if (buffer instanceof ArrayBuffer) {
      bytes = new Uint8Array(buffer.slice(0, 16));
    } else {
      bytes = buffer.slice(0, 16);
    }

    // JPEG: FF D8 FF
    if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
      return "image/jpeg";
    }

    // PNG: 89 50 4E 47 0D 0A 1A 0A
    if (
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47 &&
      bytes[4] === 0x0d &&
      bytes[5] === 0x0a &&
      bytes[6] === 0x1a &&
      bytes[7] === 0x0a
    ) {
      return "image/png";
    }

    // GIF: 47 49 46 38 (GIF8)
    if (
      bytes[0] === 0x47 &&
      bytes[1] === 0x49 &&
      bytes[2] === 0x46 &&
      bytes[3] === 0x38
    ) {
      return "image/gif";
    }

    // WebP: 52 49 46 46 (RIFF) ... 57 45 42 50 (WEBP)
    if (
      bytes[0] === 0x52 &&
      bytes[1] === 0x49 &&
      bytes[2] === 0x46 &&
      bytes[3] === 0x46 &&
      bytes[8] === 0x57 &&
      bytes[9] === 0x45 &&
      bytes[10] === 0x42 &&
      bytes[11] === 0x50
    ) {
      return "image/webp";
    }

    return null;
  }

  static detectImageMimeType(
    buffer: ImageBuffer,
    filename?: string
  ): ImageMimeType {
    const mimeFromExtension =
      ImageUtils.detectMimeTypeFromExtension(filename);
    if (mimeFromExtension) {
      return mimeFromExtension;
    }

    const mimeFromBuffer = ImageUtils.detectMimeTypeFromBuffer(buffer);
    if (mimeFromBuffer) {
      return mimeFromBuffer;
    }

    return "image/jpeg";
  }
}
