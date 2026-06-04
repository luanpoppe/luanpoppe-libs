import type { AudioBuffer, AudioMimeType } from "../@types/audio";
import { MIME_TO_EXTENSION } from "../@types/audio";

export function getAudioExtension(format?: string | AudioMimeType): string {
  if (!format) return "mp3";
  if (format.startsWith("audio/")) {
    return MIME_TO_EXTENSION[format as AudioMimeType] ?? "mp3";
  }
  return format.replace(/^\./, "");
}

export function toAudioBuffer(audioBuffer: AudioBuffer): Buffer {
  if (audioBuffer instanceof Buffer) return audioBuffer;
  if (audioBuffer instanceof ArrayBuffer) return Buffer.from(audioBuffer);
  return Buffer.from(audioBuffer as Uint8Array);
}

export function bufferToBase64(audioBuffer: AudioBuffer): string {
  return toAudioBuffer(audioBuffer).toString("base64");
}
