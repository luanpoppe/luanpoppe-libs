import { LangchainModels } from "./src/langchain/models";
import { AIModelNames } from "./src/@types/model-names";
import z from "zod";
import { LangchainMessages, MessageInput } from "./src/langchain/messages";
import {
  AgentMiddleware,
  BaseMessage,
  createAgent,
  modelFallbackMiddleware,
  modelRetryMiddleware,
} from "langchain";

export type CallParams = {
  aiModel: AIModelNames;
  messages: MessageInput[];
  systemPrompt?: string;
  maxRetries?: number;
  middleware?: AgentMiddleware[];
};

export type CallReturn = Promise<{
  text: string;
  messages: BaseMessage[];
}>;

export type CallStructuredOutputParams<T extends z.ZodSchema> = CallParams & {
  outputSchema: T;
};

export type CallStructuredOutputReturn<T> = Promise<{
  response: z.infer<T>;
}>;

export class Langchain {
  constructor() {}

  async call(params: CallParams): CallReturn {
    const { aiModel, messages, systemPrompt, maxRetries = 3 } = params;
    const { middleware } = params;

    const model = this.getModel(aiModel);
    const agent = createAgent({
      model,
      systemPrompt: systemPrompt ?? "",
      middleware: [
        ...this.standardMiddlewares(maxRetries),
        ...(middleware ?? []),
      ],
    });

    const response = await agent.invoke({ messages });

    return {
      text: response.messages[0]?.text ?? "Empty response from the model",
      messages: response.messages,
    };
  }

  async callStructuredOutput<T extends z.ZodSchema>(
    params: CallStructuredOutputParams<T>
  ): CallStructuredOutputReturn<typeof params.outputSchema> {
    const { aiModel, outputSchema, messages, systemPrompt } = params;
    const { maxRetries = 3, middleware } = params;

    const model = this.getModel(aiModel);
    const agent = createAgent({
      model,
      systemPrompt: systemPrompt ?? "",
      responseFormat: outputSchema as any,
      middleware: [
        ...this.standardMiddlewares(maxRetries),
        ...(middleware ?? []),
      ],
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
      });
    }

    if (aiModel.startsWith("gemini")) {
      return LangchainModels.gemini({
        model: aiModel,
      });
    }

    throw new Error("Model not supported");
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
