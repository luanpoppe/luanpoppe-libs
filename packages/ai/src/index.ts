import { LangchainModels } from "./langchain/models";
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
  aiModel: AIModelNames;
  messages: MessageInput[];
  systemPrompt?: string;
  maxRetries?: number;
  middleware?: AgentMiddleware[];
  tools?: (ServerTool | ClientTool)[];
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

  private getModel(aiModel: AIModelNames) {
    if (aiModel.startsWith("gpt")) {
      return LangchainModels.gpt({
        modelName: aiModel,
        apiKey: this.tokens.openAIApiKey,
      });
    }

    if (aiModel.startsWith("gemini")) {
      return LangchainModels.gemini({
        model: aiModel,
        apiKey: this.tokens.googleGeminiToken ?? "",
      });
    }

    throw new Error("Model not supported");
  }

  private standardAgent(
    params: LangchainCallParams
  ): Parameters<typeof createAgent>[0] {
    const { aiModel, systemPrompt, maxRetries = 3, middleware, tools } = params;

    const model = this.getModel(aiModel);
    return {
      model,
      systemPrompt: systemPrompt ?? "",
      middleware: [
        ...this.standardMiddlewares(maxRetries),
        ...(middleware ?? []),
      ],
      tools: tools ?? [],
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
