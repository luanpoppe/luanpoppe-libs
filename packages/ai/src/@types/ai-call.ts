import type { AgentMiddleware, BaseMessage } from "langchain";
import type { ClientTool, ServerTool } from "@langchain/core/tools";
import type { LLMModelConfig } from "../langchain/models";
import type { AIModelNames } from "./model-names";
import type { MessageInput } from "../langchain/messages";
import type z from "zod";

export type AICallParams = {
  agent?: {
    middleware?: AgentMiddleware[];
    tools?: (ServerTool | ClientTool)[];
  };

  modelConfig?: Omit<LLMModelConfig, "apiKey" | "model">;

  aiModel: AIModelNames;
  /** Lista de modelos de fallback quando o principal falhar após todos os retries (suporta OpenRouter, Gemini, GPT) */
  aiModelsFallback?: AIModelNames[];
  messages: MessageInput[];
  systemPrompt?: string;
  maxRetries?: number;
  /** ID da thread/conversa para persistência de histórico (obrigatório quando memory/checkpointer está ativo) */
  threadId?: string;
};

export type AICallReturn = Promise<{
  text: string;
  messages: BaseMessage[];
}>;

export type AICallStructuredOutputParams<T extends z.ZodSchema> =
  AICallParams & {
    outputSchema: T;
  };

export type AICallStructuredOutputReturn<T> = Promise<{
  response: z.infer<T>;
}>;
