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
import { ClientTool, ServerTool } from "@langchain/core/tools";

export type CallParams = {
  aiModel: AIModelNames;
  messages: MessageInput[];
  systemPrompt?: string;
  maxRetries?: number;
  middleware?: AgentMiddleware[];
  tools?: (ServerTool | ClientTool)[];
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
    const { messages } = params;

    const agent = createAgent({
      ...this.standardAgent(params),
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
      });
    }

    if (aiModel.startsWith("gemini")) {
      return LangchainModels.gemini({
        model: aiModel,
      });
    }

    throw new Error("Model not supported");
  }

  private standardAgent(params: CallParams): Parameters<typeof createAgent>[0] {
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

const example = async () => {
  const langchain = new Langchain();

  const outputSchema = z.object({
    answer: z.string(),
  });

  const messages = [
    LangchainMessages.system("You are a helpful assistant."),
    LangchainMessages.human("What is the capital of France?"),
  ];

  const { response } = await langchain.callStructuredOutput({
    aiModel: "gemini-2.5-flash",
    outputSchema,
    messages,
  });

  console.log({ response });
};

example();
