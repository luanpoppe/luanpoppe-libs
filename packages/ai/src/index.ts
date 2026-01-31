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
  openRouterApiKey?: string;
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
  constructor(private tokens: LangchainConstructor) { }

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
    const { outputSchema, messages, aiModel } = params;

    // Normaliza o schema para compatibilidade com OpenAI/OpenRouter
    // OpenAI exige que todos os campos em properties estejam no array required
    const normalizedSchema = this.normalizeSchemaForOpenAI(
      outputSchema,
      aiModel
    );

    const agent = createAgent({
      ...this.standardAgent(params),
      responseFormat: normalizedSchema as any,
    });

    const response = await agent.invoke({
      messages,
    });

    const parsedResponse = outputSchema.parse(response?.structuredResponse);

    return { response: parsedResponse };
  }

  /**
   * Normaliza schemas Zod para compatibilidade com OpenAI/OpenRouter
   * OpenAI exige que todos os campos em properties estejam no array required
   * quando usa response_format: 'extract'
   */
  private normalizeSchemaForOpenAI<T extends z.ZodSchema>(
    schema: T,
    aiModel: string
  ): z.ZodSchema {
    // Apenas normaliza para modelos OpenAI/OpenRouter
    const isOpenAIModel =
      aiModel.startsWith("gpt") ||
      aiModel.startsWith("openrouter/openai/");

    if (!isOpenAIModel) {
      return schema;
    }

    // Se o schema é um objeto Zod, precisamos normalizar campos opcionais
    if (schema instanceof z.ZodObject) {
      const shape = schema.shape;
      const newShape: Record<string, z.ZodTypeAny> = {};

      // Converte campos opcionais para nullable para compatibilidade com OpenAI
      // OpenAI requer que todos os campos estejam no array required
      for (const [key, value] of Object.entries(shape)) {
        if (value instanceof z.ZodOptional) {
          // Converte .optional() para .nullable() para compatibilidade com OpenAI
          const innerType = value._def.innerType as z.ZodTypeAny;
          // Usa z.union para criar um tipo nullable
          newShape[key] = z.union([innerType, z.null()]);
        } else {
          newShape[key] = value;
        }
      }

      return z.object(newShape);
    }

    return schema;
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

    if (aiModel.startsWith("openrouter/")) {
      const modelName = aiModel.replace(/^openrouter\//, "");
      return LangchainModels.openrouter({
        ...config,
        model: modelName,
        apiKey: this.tokens.openRouterApiKey,
      });
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
