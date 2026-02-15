import z from "zod";
import { AI } from "./ai";
import type {
  AICallParams,
  AICallReturn,
  AICallStructuredOutputParams,
  AICallStructuredOutputReturn,
} from "./@types/ai-call";

export { AI };
export type {
  AICallParams,
  AICallReturn,
  AICallStructuredOutputParams,
  AICallStructuredOutputReturn,
} from "./@types/ai-call";

export { AIModels } from "./langchain/models";
export { AIMessages } from "./langchain/messages";
export { AITools } from "./langchain/tools";
export { createCheckpointer } from "./langchain/checkpointers";
export type {
  MemoryConfig,
  BaseCheckpointSaver,
  MemoryCheckpointerConfig,
  SqliteCheckpointerConfig,
  PostgresCheckpointerConfig,
  RedisCheckpointerConfig,
  MongoDBCheckpointerConfig,
} from "./langchain/checkpointers";
export { AIAudioTranscription } from "./langchain/audio-transcription";
export { AudioUtils } from "./utils/audio-utils";
export type { AudioBuffer, AudioMimeType } from "./@types/audio";
export type {
  AudioContentBlock,
  HumanMessageWithAudioOptions,
} from "./langchain/messages";
export type {
  WhisperModel,
  WhisperTranscriptionOptions,
} from "./langchain/audio-transcription";

// Aliases para compatibilidade (deprecated - serão removidos em 2.0.0)
/** @deprecated Use AI instead. Will be removed in 2.0.0 */
export { AI as Langchain };
/** @deprecated Use AICallParams instead. Will be removed in 2.0.0 */
export type LangchainCallParams = AICallParams;
/** @deprecated Use AICallReturn instead. Will be removed in 2.0.0 */
export type LangchainCallReturn = AICallReturn;
/** @deprecated Use AICallStructuredOutputParams instead. Will be removed in 2.0.0 */
export type LangchainCallStructuredOutputParams<T extends z.ZodSchema> =
  AICallStructuredOutputParams<T>;
/** @deprecated Use AICallStructuredOutputReturn instead. Will be removed in 2.0.0 */
export type LangchainCallStructuredOutputReturn<T> =
  AICallStructuredOutputReturn<T>;
/** @deprecated Use AIModels instead. Will be removed in 2.0.0 */
export { AIModels as LangchainModels } from "./langchain/models";
/** @deprecated Use AIMessages instead. Will be removed in 2.0.0 */
export { AIMessages as LangchainMessages } from "./langchain/messages";
/** @deprecated Use AITools instead. Will be removed in 2.0.0 */
export { AITools as LangchainTools } from "./langchain/tools";
/** @deprecated Use AIAudioTranscription instead. Will be removed in 2.0.0 */
export { AIAudioTranscription as LangchainAudioTranscription } from "./langchain/audio-transcription";
