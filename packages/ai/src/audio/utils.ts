import type { AudioBuffer, AudioMimeType } from "../@types/audio";
import { MIME_TO_EXTENSION } from "../@types/audio";
import { BufferUtils } from "../utils/buffer-utils";

export function getAudioExtension(format?: string | AudioMimeType): string {
  if (!format) return "mp3";
  if (format.startsWith("audio/")) {
    return MIME_TO_EXTENSION[format as AudioMimeType] ?? "mp3";
  }
  return format.replace(/^\./, "");
}

export function toAudioBuffer(audioBuffer: AudioBuffer): Buffer {
  return BufferUtils.toBuffer(audioBuffer);
}

export function bufferToBase64(audioBuffer: AudioBuffer): string {
  return BufferUtils.bufferToBase64(audioBuffer);
}
