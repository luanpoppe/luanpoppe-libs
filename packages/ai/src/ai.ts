import { AIModels, LLMModelConfig } from "./langchain/models";
import z from "zod";
import {
  createAgent,
  modelFallbackMiddleware,
  modelRetryMiddleware,
} from "langchain";
import {
  createCheckpointer,
  type BaseCheckpointSaver,
  type MemoryConfig,
} from "./langchain/checkpointers";
import type {
  AICallParams,
  AICallReturn,
  AICallStructuredOutputParams,
  AICallStructuredOutputReturn,
} from "./@types/ai-call";

export type {
  AICallParams,
  AICallReturn,
  AICallStructuredOutputParams,
  AICallStructuredOutputReturn,
} from "./@types/ai-call";

type AIConstructor = {
  googleGeminiToken?: string;
  openAIApiKey?: string;
  openRouterApiKey?: string;
  /** Configuração de persistência de histórico (memory, sqlite, postgres, redis, mongodb) */
  memory?: MemoryConfig;
  /** Instância de checkpointer para usuários avançados (alternativa a memory) */
  checkpointer?: BaseCheckpointSaver;
};

export class AI {
  private checkpointer: BaseCheckpointSaver | undefined;
  private checkpointerPromise: Promise<BaseCheckpointSaver> | undefined;

  constructor(private config: AIConstructor) {
    if (config.checkpointer) {
      this.checkpointer = config.checkpointer;
    }
  }

  private async getCheckpointer(): Promise<BaseCheckpointSaver | undefined> {
    if (this.checkpointer) return this.checkpointer;
    if (this.config.memory) {
      if (!this.checkpointerPromise) {
        this.checkpointerPromise = createCheckpointer(this.config.memory);
      }
      this.checkpointer = await this.checkpointerPromise;
      return this.checkpointer;
    }
    return undefined;
  }

  private ensureThreadIdWhenCheckpointer(params: AICallParams): void {
    if (this.config.checkpointer || this.config.memory) {
      if (!params.threadId) {
        throw new Error(
          "threadId é obrigatório quando memory ou checkpointer está configurado. " +
            "Passe threadId em AICallParams para identificar a conversa.",
        );
      }
    }
  }

  async call(params: AICallParams): AICallReturn {
    const { messages } = params;

    this.ensureThreadIdWhenCheckpointer(params);
    const checkpointer = await this.getCheckpointer();

    const agent = createAgent({
      ...this.standardAgent(params, checkpointer),
    });

    const invokeConfig =
      params.threadId && checkpointer
        ? { configurable: { thread_id: params.threadId } }
        : undefined;

    const response = await agent.invoke({ messages }, invokeConfig as any);

    const rawContent = response.messages.at(-1)?.content as string | undefined;
    const text =
      typeof rawContent === "string" && rawContent.trim()
        ? rawContent
        : "Empty response from the model";
    return {
      text,
      messages: response.messages,
    };
  }

  async callStructuredOutput<T extends z.ZodSchema>(
    params: AICallStructuredOutputParams<T>,
  ): AICallStructuredOutputReturn<typeof params.outputSchema> {
    const { outputSchema, messages, aiModel } = params;

    this.ensureThreadIdWhenCheckpointer(params);
    const checkpointer = await this.getCheckpointer();

    // Normaliza o schema para compatibilidade com OpenAI/OpenRouter
    // OpenAI exige que todos os campos em properties estejam no array required
    const normalizedSchema = this.normalizeSchemaForOpenAI(
      outputSchema,
      aiModel,
    );

    const agent = createAgent({
      ...this.standardAgent(params, checkpointer),
      responseFormat: normalizedSchema as any,
    });

    const invokeConfig =
      params.threadId && checkpointer
        ? { configurable: { thread_id: params.threadId } }
        : undefined;

    const response = await agent.invoke({ messages }, invokeConfig as any);

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
    aiModel: string,
  ): z.ZodSchema {
    // Apenas normaliza para modelos OpenAI/OpenRouter
    const isOpenAIModel =
      aiModel.startsWith("gpt") || aiModel.startsWith("openrouter/openai/");

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

  async getRawAgent(
    params: AICallParams,
    outputSchema?: z.ZodSchema | undefined,
  ): Promise<{ agent: ReturnType<typeof createAgent> }> {
    this.ensureThreadIdWhenCheckpointer(params);
    const checkpointer = await this.getCheckpointer();

    const agent = createAgent({
      ...this.standardAgent(params, checkpointer),
      responseFormat: outputSchema as any,
    });

    return { agent };
  }

  private getModel(params: AICallParams) {
    const { aiModel, modelConfig } = params;

    const config: LLMModelConfig = {
      model: aiModel,
      maxTokens: modelConfig?.maxTokens,
      temperature: modelConfig?.temperature,
    };

    if (aiModel.startsWith("gpt")) {
      config.apiKey = this.config.openAIApiKey;

      return AIModels.gpt(config);
    }

    if (aiModel.startsWith("gemini")) {
      config.apiKey = this.config.googleGeminiToken;

      return AIModels.gemini(config);
    }

    if (aiModel.startsWith("openrouter/")) {
      const modelName = aiModel.replace(/^openrouter\//, "");
      return AIModels.openrouter({
        ...config,
        model: modelName,
        apiKey: this.config.openRouterApiKey,
      });
    }

    throw new Error("Model not supported");
  }

  private standardAgent(
    params: AICallParams,
    checkpointer?: BaseCheckpointSaver,
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
      ...(checkpointer && { checkpointer }),
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
