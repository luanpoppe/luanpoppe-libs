/** Formas de buffer aceitas pela biblioteca (áudio e imagem). */
export type BufferLike = Buffer | ArrayBuffer | Uint8Array;

/**
 * Conversões de buffer compartilhadas por áudio e imagem — antes duplicadas
 * em `AudioUtils` e `ImageUtils`.
 */
export class BufferUtils {
  static toBuffer(buffer: BufferLike): Buffer {
    if (buffer instanceof Buffer) {
      return buffer;
    }
    if (buffer instanceof ArrayBuffer) {
      return Buffer.from(buffer);
    }
    if (buffer instanceof Uint8Array) {
      return Buffer.from(buffer);
    }
    throw new Error("Tipo de buffer não suportado");
  }

  static bufferToBase64(buffer: BufferLike): string {
    return BufferUtils.toBuffer(buffer).toString("base64");
  }
}
