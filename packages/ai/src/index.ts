import { LangchainModels, LLMModelConfig } from "./langchain/models";
import { AIModelNames } from "./@types/model-names";
import z from "zod";
import { MessageInput } from "./langchain/messages";
import {
  AgentMiddleware,
  BaseMessage,
  createAgent,
  modelFallbackMiddleware,
  modelRetryMiddleware,
} from "langchain";
import { ClientTool, ServerTool } from "@langchain/core/tools";
import { LangchainMessages } from "./langchain/messages";
import { LangchainTools } from "./langchain/tools";

type LangchainConstructor = {
  googleGeminiToken?: string;
  openAIApiKey?: string;
};

export type LangchainCallParams = {
  agent?: {
    middleware?: AgentMiddleware[];
    tools?: (ServerTool | ClientTool)[];
  };

  modelConfig?: Omit<LLMModelConfig, "apiKey" | "model">;

  aiModel: AIModelNames;
  messages: MessageInput[];
  systemPrompt?: string;
  maxRetries?: number;
};

export type LangchainCallReturn = Promise<{
  text: string;
  messages: BaseMessage[];
}>;

export type LangchainCallStructuredOutputParams<T extends z.ZodSchema> =
  LangchainCallParams & {
    outputSchema: T;
  };

export type LangchainCallStructuredOutputReturn<T> = Promise<{
  response: z.infer<T>;
}>;

export class Langchain {
  constructor(private tokens: LangchainConstructor) {}

  async call(params: LangchainCallParams): LangchainCallReturn {
    const { messages } = params;

    const agent = createAgent({
      ...this.standardAgent(params),
    });

    const response = await agent.invoke({ messages });

    return {
      text:
        (response.messages.at(-1)?.content as string) ??
        "Empty response from the model",
      messages: response.messages,
    };
  }

  async callStructuredOutput<T extends z.ZodSchema>(
    params: LangchainCallStructuredOutputParams<T>
  ): LangchainCallStructuredOutputReturn<typeof params.outputSchema> {
    const { outputSchema, messages } = params;

    const agent = createAgent({
      ...this.standardAgent(params),
      responseFormat: outputSchema as any,
    });

    const response = await agent.invoke({
      messages,
    });

    const parsedResponse = outputSchema.parse(response?.structuredResponse);

    return { response: parsedResponse };
  }

  getRawAgent(
    params: LangchainCallParams,
    outputSchema?: z.ZodSchema | undefined
  ) {
    const agent = createAgent({
      ...this.standardAgent(params),
      responseFormat: outputSchema as any,
    });

    return { agent };
  }

  private getModel(params: LangchainCallParams) {
    const { aiModel, modelConfig } = params;

    const config: LLMModelConfig = {
      model: aiModel,
      maxTokens: modelConfig?.maxTokens,
      temperature: modelConfig?.temperature,
    };

    if (aiModel.startsWith("gpt")) {
      config.apiKey = this.tokens.openAIApiKey;

      return LangchainModels.gpt(config);
    }

    if (aiModel.startsWith("gemini")) {
      config.apiKey = this.tokens.googleGeminiToken;

      return LangchainModels.gemini(config);
    }

    throw new Error("Model not supported");
  }

  private standardAgent(
    params: LangchainCallParams
  ): Parameters<typeof createAgent>[0] {
    const { systemPrompt, maxRetries = 3 } = params;

    const model = this.getModel(params);
    return {
      model,
      systemPrompt: systemPrompt ?? "",
      middleware: [
        ...this.standardMiddlewares(maxRetries),
        ...(params.agent?.middleware ?? []),
      ],
      tools: params.agent?.tools ?? [],
      responseFormat: undefined as any,
    };
  }

  private standardMiddlewares(maxRetries: number) {
    return [
      modelRetryMiddleware({
        maxRetries,
        backoffFactor: 2.0,
        initialDelayMs: 1000,
      }),
      modelFallbackMiddleware("gemini-2.5-flash", "gpt-4o-mini"),
    ];
  }
}

export { LangchainModels, LangchainMessages, LangchainTools };
