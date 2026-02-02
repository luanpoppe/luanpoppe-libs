export type AudioBuffer = Buffer | ArrayBuffer | Uint8Array;

export type AudioMimeType =
  | "audio/mpeg"
  | "audio/mp3"
  | "audio/wav"
  | "audio/wave"
  | "audio/x-wav"
  | "audio/mp4"
  | "audio/m4a"
  | "audio/webm"
  | "audio/ogg"
  | "audio/flac"
  | "audio/aac"
  | "audio/opus";

export const MIME_TO_EXTENSION: Record<AudioMimeType, string> = {
  "audio/mpeg": "mp3",
  "audio/mp3": "mp3",
  "audio/wav": "wav",
  "audio/wave": "wav",
  "audio/x-wav": "wav",
  "audio/mp4": "mp4",
  "audio/m4a": "m4a",
  "audio/webm": "webm",
  "audio/ogg": "ogg",
  "audio/flac": "flac",
  "audio/aac": "aac",
  "audio/opus": "opus",
};
