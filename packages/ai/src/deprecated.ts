import z from "zod";
import { AI } from "./ai";
import type {
  AICallParams,
  AICallReturn,
  AICallStructuredOutputParams,
  AICallStructuredOutputReturn,
} from "./@types/ai-call";

/**
 * Aliases de compatibilidade da v1, isolados do barrel principal.
 * Serão removidos em 2.0.0 — prefira sempre os nomes sem o prefixo `Langchain*`.
 */

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
/** @deprecated Use AIAudio instead. Will be removed in 2.0.0 */
export { AIAudioTranscription } from "./langchain/audio-transcription";
/** @deprecated Use AIAudioTranscription instead. Will be removed in 2.0.0 */
export { AIAudioTranscription as LangchainAudioTranscription } from "./langchain/audio-transcription";
/** @deprecated Use OpenAITranscriptionOptions from AIAudio. Will be removed in 2.0.0 */
export type { WhisperTranscriptionOptions } from "./langchain/audio-transcription";
