import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import {
  MIME_TO_EXTENSION,
  type AudioBuffer,
  type AudioMimeType,
} from "../@types/audio";

export class FilesUtils {
  static createTempFile(
    audioBuffer: AudioBuffer,
    prefix: string = "audio",
    format?: string | AudioMimeType
  ): string {
    const extension = format
      ? format.startsWith("audio/")
        ? MIME_TO_EXTENSION[format as AudioMimeType] ?? "mp3"
        : format.replace(/^\./, "")
      : "mp3";

    const tempDir = os.tmpdir();
    const tempFilePath = path.join(
      tempDir,
      `${prefix}-${Date.now()}-${Math.random()
        .toString(36)
        .substring(7)}.${extension}`
    );

    // Converte o buffer para Buffer se necessário
    let buffer: Buffer;
    if (audioBuffer instanceof Buffer) {
      buffer = audioBuffer;
    } else if (audioBuffer instanceof ArrayBuffer) {
      buffer = Buffer.from(audioBuffer);
    } else {
      buffer = Buffer.from(audioBuffer);
    }

    // Escreve o arquivo temporário
    fs.writeFileSync(tempFilePath, buffer);
    return tempFilePath;
  }

  static cleanupTempFile(filePath: string): void {
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (error) {
        console.warn(`Erro ao remover arquivo temporário: ${error}`);
      }
    }
  }
}
