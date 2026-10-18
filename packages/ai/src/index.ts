import { AI } from "./ai";

export { AI };
export type { AIConstructor } from "./ai";
export type { AIAgent } from "./@types/agent";
export type {
  AICallAgentConfig,
  AICallModelConfig,
  AICallParams,
  AICallReturn,
  AICallStructuredOutputParams,
  AICallStructuredOutputReturn,
} from "./@types/ai-call";
export type {
  AIModelNames,
  AnthropicModels,
  ChatGPTModels,
  DeepSeekModels,
  GeminiModels,
  LocalModels,
  MiniMaxModels,
  MoonshotModels,
  OllamaModels,
  OpenRouterModels,
  OpenRouterProvidersModels,
  QwenModels,
  XiaomiModels,
  ZAiModels,
} from "./@types/model-names";

// Tipos de fronteira: re-exportados para o consumidor não precisar alcançar as
// dependências transitivas (langchain, @langchain/core, @langchain/langgraph).
// Com gerenciadores estritos (pnpm/yarn), elas não ficam acessíveis no projeto dele.
export type { AgentMiddleware, BaseMessage } from "langchain";
export type { ClientTool, ServerTool } from "@langchain/core/tools";
export type { StateSnapshot } from "@langchain/langgraph";

export { AIModels } from "./langchain/models";
export {
  DEFAULT_OLLAMA_BASE_URL,
  DEFAULT_LOCAL_API_KEY,
} from "./langchain/models";
export type {
  LLMModelConfig,
  OllamaModelConfig,
  OpenAICompatibleModelConfig,
  ReasoningEffort,
  OpenRouterMaxPrice,
  OpenRouterProviderPreferences,
  OpenRouterProviderSort,
} from "./langchain/models";
export { resolveOpenRouterProvider } from "./langchain/models";
// Tipos de retorno dos modelos low-level de `AIModels`.
export type { ChatOpenAI } from "@langchain/openai";
export type { ChatGoogleGenerativeAI } from "@langchain/google-genai";
export type { ChatOllama } from "@langchain/ollama";
export { AIMessages } from "./langchain/messages";
export type { MessageInput } from "./langchain/messages";
export { AITools } from "./langchain/tools";
export type { CreateToolParams } from "./langchain/tools";
export { AIMemory } from "./langchain/memory";
export type {
  MemoryConfig,
  BaseCheckpointSaver,
  MemoryCheckpointerConfig,
  SqliteCheckpointerConfig,
  PostgresCheckpointerConfig,
  RedisCheckpointerConfig,
  MongoDBCheckpointerConfig,
  GraphWithStateHistory,
  MessageRole,
  HistoryMessageItem,
  GetHistoryResult,
} from "./langchain/memory";
export { AIAudio } from "./audio";
export type {
  WhisperModel,
  OpenAITranscriptionOptions,
  OpenAITranscriptionResponseFormat,
  OpenAITranscriptionDetailed,
  OpenRouterTranscriptionOptions,
  OpenRouterTranscriptionResult,
  OpenAISpeechOptions,
  OpenAISpeechModel,
  OpenAISpeechResponseFormat,
  OpenRouterSpeechOptions,
  SpeechResult,
  TranscriptionWord,
  TranscriptionSegment,
  DiarizedSegment,
  GeminiTranscriptionOptions,
} from "./audio";
export { ANTHROPIC_NO_NATIVE_AUDIO } from "./audio";
export { AIEmbeddings, ANTHROPIC_NO_NATIVE_EMBEDDINGS } from "./embeddings";
export type {
  AIEmbeddingModelNames,
  OpenAIEmbeddingModel,
  GeminiEmbeddingModel,
  OpenRouterEmbeddingModel,
  OpenRouterPrefixedEmbeddingModel,
  EmbeddingResult,
  EmbeddingUsage,
  OpenAIEmbeddingOptions,
  OpenRouterEmbeddingOptions,
  GeminiEmbeddingOptions,
  GeminiEmbeddingTaskType,
  EmbedApiKeys,
  EmbedOptions,
} from "./embeddings";
export { AudioUtils } from "./utils/audio-utils";
export { ImageUtils } from "./utils/image-utils";
export { BufferUtils } from "./utils/buffer-utils";
export type { AudioBuffer, AudioMimeType } from "./@types/audio";
export type { ImageBuffer, ImageMimeType } from "./@types/image";
export type {
  AudioContentBlock,
  HumanMessageWithAudioOptions,
  ImageContentBlock,
  HumanMessageWithImageOptions,
} from "./langchain/messages";

// Aliases deprecated (Langchain*, AIAudioTranscription, ...) vivem em ./deprecated
export * from "./deprecated";
