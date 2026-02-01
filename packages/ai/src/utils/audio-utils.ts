import type { AudioBuffer, AudioMimeType } from "../@types/audio";

export class AudioUtils {
  static bufferToBase64(buffer: AudioBuffer): string {
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

  static detectMimeTypeFromExtension(filename?: string): AudioMimeType | null {
    if (!filename) {
      return null;
    }

    const extension = filename.toLowerCase().split(".").pop();

    const mimeTypeMap: Record<string, AudioMimeType> = {
      mp3: "audio/mp3",
      mpeg: "audio/mp3",
      wav: "audio/wav",
      wave: "audio/wave",
      mp4: "audio/mp4",
      m4a: "audio/m4a",
      webm: "audio/webm",
      ogg: "audio/ogg",
      flac: "audio/flac",
      aac: "audio/aac",
      opus: "audio/opus",
    };

    return extension ? mimeTypeMap[extension] || null : null;
  }

  static detectMimeTypeFromBuffer(buffer: AudioBuffer): AudioMimeType | null {
    let bytes: Uint8Array;

    if (buffer instanceof Buffer) {
      bytes = new Uint8Array(buffer.slice(0, 12));
    } else if (buffer instanceof ArrayBuffer) {
      bytes = new Uint8Array(buffer.slice(0, 12));
    } else {
      bytes = buffer.slice(0, 12);
    }

    // MP3: FF FB ou FF F3 ou FF F2 ou 49 44 33 (ID3)
    if (
      (bytes[0] === 0xff &&
        (bytes[1] === 0xfb || bytes[1] === 0xf3 || bytes[1] === 0xf2)) ||
      (bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33)
    ) {
      return "audio/mp3";
    }

    // WAV: 52 49 46 46 (RIFF) seguido de 57 41 56 45 (WAVE)
    if (
      bytes[0] === 0x52 &&
      bytes[1] === 0x49 &&
      bytes[2] === 0x46 &&
      bytes[3] === 0x46 &&
      bytes[8] === 0x57 &&
      bytes[9] === 0x41 &&
      bytes[10] === 0x56 &&
      bytes[11] === 0x45
    ) {
      return "audio/wav";
    }

    // MP4/M4A: ftyp seguido de isom ou M4A
    if (
      bytes[4] === 0x66 &&
      bytes[5] === 0x74 &&
      bytes[6] === 0x79 &&
      bytes[7] === 0x70
    ) {
      if (
        (bytes[8] === 0x69 &&
          bytes[9] === 0x73 &&
          bytes[10] === 0x6f &&
          bytes[11] === 0x6d) ||
        (bytes[8] === 0x4d && bytes[9] === 0x34 && bytes[10] === 0x41)
      ) {
        return "audio/mp4";
      }
    }

    // WebM: 1a 45 df a3
    if (
      bytes[0] === 0x1a &&
      bytes[1] === 0x45 &&
      bytes[2] === 0xdf &&
      bytes[3] === 0xa3
    ) {
      return "audio/webm";
    }

    // OGG: 4f 67 67 53
    if (
      bytes[0] === 0x4f &&
      bytes[1] === 0x67 &&
      bytes[2] === 0x67 &&
      bytes[3] === 0x53
    ) {
      return "audio/ogg";
    }

    // FLAC: 66 4c 61 43 (fLaC)
    if (
      bytes[0] === 0x66 &&
      bytes[1] === 0x4c &&
      bytes[2] === 0x61 &&
      bytes[3] === 0x43
    ) {
      return "audio/flac";
    }

    return null;
  }

  static detectAudioMimeType(
    buffer: AudioBuffer,
    filename?: string
  ): AudioMimeType {
    // Tenta primeiro pela extensão
    const mimeFromExtension = AudioUtils.detectMimeTypeFromExtension(filename);
    if (mimeFromExtension) {
      return mimeFromExtension;
    }

    // Se não encontrou, tenta pelos magic bytes
    const mimeFromBuffer = AudioUtils.detectMimeTypeFromBuffer(buffer);
    if (mimeFromBuffer) {
      return mimeFromBuffer;
    }

    // Fallback para MP3 (mais comum)
    return "audio/mp3";
  }
}
