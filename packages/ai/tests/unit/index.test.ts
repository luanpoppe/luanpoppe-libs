import { AI } from "../../src/index";
import { AIModels } from "../../src/langchain/models";
import { createAgent } from "langchain";
import { AIMessages } from "../../src/langchain/messages";
import { AIMemory } from "../../src/langchain/memory";
import z from "zod";

// Mock das dependências
vi.mock("langchain", async () => {
  const actual = await vi.importActual("langchain");
  return {
    ...actual,
    createAgent: vi.fn(),
    modelRetryMiddleware: vi.fn((config) => ({ type: "retry", ...config })),
  };
});

vi.mock("../../src/langchain/models", () => ({
  AIModels: {
    gpt: vi.fn(),
    gemini: vi.fn(),
    openrouter: vi.fn(),
  },
}));

vi.mock("../../src/langchain/memory", async () => {
  const actual = await vi.importActual("../../src/langchain/memory");
  return {
    ...actual,
    AIMemory: vi.fn().mockImplementation(function () {
      return {
        getCheckpointer: vi.fn().mockResolvedValue({}),
        setAgent: vi.fn(),
      };
    }),
  };
});

describe("AI", () => {
  let ai: AI;
  const mockTokens = {
    openAIApiKey: "test-openai-key",
    googleGeminiToken: "test-gemini-token",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    ai = new AI(mockTokens);
  });

  describe("constructor", () => {
    it("deve criar uma instância com tokens fornecidos", () => {
      const instance = new AI(mockTokens);
      expect(instance).toBeInstanceOf(AI);
    });

    it("deve criar uma instância com apenas openAIApiKey", () => {
      const instance = new AI({ openAIApiKey: "test-key" });
      expect(instance).toBeInstanceOf(AI);
    });

    it("deve criar uma instância com apenas googleGeminiToken", () => {
      const instance = new AI({ googleGeminiToken: "test-token" });
      expect(instance).toBeInstanceOf(AI);
    });

    it("deve criar uma instância com memory config e expor getter memory", () => {
      const instance = new AI({
        openAIApiKey: "test-key",
        memory: { type: "memory" },
      });
      expect(instance).toBeInstanceOf(AI);
      expect(instance.memory).toBeDefined();
    });

    it("deve criar uma instância com checkpointer", () => {
      const mockCheckpointer = {} as any;
      const instance = new AI({
        openAIApiKey: "test-key",
        checkpointer: mockCheckpointer,
      });
      expect(instance).toBeInstanceOf(AI);
      expect(() => instance.memory).toThrow("memory não está configurado");
    });

    it("memory getter deve lançar erro quando memory não está configurado", () => {
      const instance = new AI({ openAIApiKey: "test-key" });
      expect(() => instance.memory).toThrow("memory não está configurado");
    });
  });

  describe("call", () => {
    it("deve chamar o agente e retornar a resposta correta", async () => {
      const mockModel = {} as any;
      const mockMessages = [AIMessages.human("Olá")];
      const mockResponse = {
        messages: [
          mockMessages[0],
          { content: "Olá! Como posso ajudar?" } as any,
        ],
      };

      vi.mocked(AIModels.gpt).mockReturnValue(mockModel);
      vi.mocked(createAgent).mockReturnValue({
        invoke: vi.fn().mockResolvedValue(mockResponse),
      } as any);

      const result = await ai.call({
        aiModel: "gpt-4",
        messages: mockMessages,
      });

      expect(createAgent).toHaveBeenCalled();
      expect(result.text).toBe("Olá! Como posso ajudar?");
      expect(result.messages).toEqual(mockResponse.messages);
    });

    it("deve retornar mensagem padrão quando resposta está vazia", async () => {
      const mockModel = {} as any;
      const mockMessages = [AIMessages.human("Teste")];
      const mockResponse = {
        messages: [
          mockMessages[0],
          { content: null } as any, // Última mensagem sem conteúdo
        ],
      };

      vi.mocked(AIModels.gpt).mockReturnValue(mockModel);
      vi.mocked(createAgent).mockReturnValue({
        invoke: vi.fn().mockResolvedValue(mockResponse),
      } as any);

      const result = await ai.call({
        aiModel: "gpt-4",
        messages: mockMessages,
      });

      expect(result.text).toBe("Empty response from the model");
    });

    it("deve usar systemPrompt quando fornecido", async () => {
      const mockModel = {} as any;
      const mockMessages = [AIMessages.human("Teste")];
      const mockResponse = {
        messages: [{ content: "Resposta" } as any],
      };

      vi.mocked(AIModels.gpt).mockReturnValue(mockModel);
      vi.mocked(createAgent).mockReturnValue({
        invoke: vi.fn().mockResolvedValue(mockResponse),
      } as any);

      await ai.call({
        aiModel: "gpt-4",
        messages: mockMessages,
        systemPrompt: "Você é um assistente útil",
      });

      const callArgs = vi.mocked(createAgent).mock.calls[0][0];
      expect(callArgs.systemPrompt).toBe("Você é um assistente útil");
    });

    it("deve usar maxRetries padrão quando não fornecido", async () => {
      const mockModel = {} as any;
      const mockMessages = [AIMessages.human("Teste")];
      const mockResponse = {
        messages: [{ content: "Resposta" } as any],
      };

      vi.mocked(AIModels.gpt).mockReturnValue(mockModel);
      vi.mocked(createAgent).mockReturnValue({
        invoke: vi.fn().mockResolvedValue(mockResponse),
      } as any);

      await ai.call({
        aiModel: "gpt-4",
        messages: mockMessages,
      });

      const callArgs = vi.mocked(createAgent).mock.calls[0][0];
      expect(callArgs.middleware).toBeDefined();
      expect(callArgs.middleware?.length).toBeGreaterThan(0);
    });

    it("deve usar maxRetries customizado quando fornecido", async () => {
      const mockModel = {} as any;
      const mockMessages = [AIMessages.human("Teste")];
      const mockResponse = {
        messages: [{ content: "Resposta" } as any],
      };

      vi.mocked(AIModels.gpt).mockReturnValue(mockModel);
      vi.mocked(createAgent).mockReturnValue({
        invoke: vi.fn().mockResolvedValue(mockResponse),
      } as any);

      const { modelRetryMiddleware } = await import("langchain");

      await ai.call({
        aiModel: "gpt-4",
        messages: mockMessages,
        maxRetries: 5,
      });

      expect(modelRetryMiddleware).toHaveBeenCalledWith(
        expect.objectContaining({ maxRetries: 5 }),
      );
    });

    it("deve usar modelo GPT quando aiModel começa com 'gpt'", async () => {
      const mockModel = {} as any;
      const mockMessages = [AIMessages.human("Teste")];
      const mockResponse = {
        messages: [{ content: "Resposta" } as any],
      };

      vi.mocked(AIModels.gpt).mockReturnValue(mockModel);
      vi.mocked(createAgent).mockReturnValue({
        invoke: vi.fn().mockResolvedValue(mockResponse),
      } as any);

      await ai.call({
        aiModel: "gpt-4o",
        messages: mockMessages,
      });

      expect(AIModels.gpt).toHaveBeenCalledWith({
        model: "gpt-4o",
        apiKey: mockTokens.openAIApiKey,
      });
    });

    it("deve usar modelo Gemini quando aiModel começa com 'gemini'", async () => {
      const mockModel = {} as any;
      const mockMessages = [AIMessages.human("Teste")];
      const mockResponse = {
        messages: [{ content: "Resposta" } as any],
      };

      vi.mocked(AIModels.gemini).mockReturnValue(mockModel);
      vi.mocked(createAgent).mockReturnValue({
        invoke: vi.fn().mockResolvedValue(mockResponse),
      } as any);

      await ai.call({
        aiModel: "gemini-2.5-flash",
        messages: mockMessages,
      });

      expect(AIModels.gemini).toHaveBeenCalledWith({
        model: "gemini-2.5-flash",
        apiKey: mockTokens.googleGeminiToken,
      });
    });

    it("deve lançar erro quando modelo não é suportado", async () => {
      const mockMessages = [AIMessages.human("Teste")];

      await expect(
        ai.call({
          aiModel: "unsupported-model" as any,
          messages: mockMessages,
        }),
      ).rejects.toThrow("Model not supported");
    });

    it("deve passar modelConfig quando fornecido", async () => {
      const mockModel = {} as any;
      const mockMessages = [AIMessages.human("Teste")];
      const mockResponse = {
        messages: [{ content: "Resposta" } as any],
      };

      vi.mocked(AIModels.gpt).mockReturnValue(mockModel);
      vi.mocked(createAgent).mockReturnValue({
        invoke: vi.fn().mockResolvedValue(mockResponse),
      } as any);

      await ai.call({
        aiModel: "gpt-4",
        messages: mockMessages,
        modelConfig: {
          maxTokens: 2000,
          temperature: 0.7,
        },
      });

      expect(AIModels.gpt).toHaveBeenCalledWith({
        model: "gpt-4",
        apiKey: mockTokens.openAIApiKey,
        maxTokens: 2000,
        temperature: 0.7,
      });
    });

    it("deve passar reasoningEffort no modelConfig", async () => {
      const mockModel = {} as any;
      const mockMessages = [AIMessages.human("Teste")];
      const mockResponse = {
        messages: [{ content: "Resposta" } as any],
      };

      vi.mocked(AIModels.gpt).mockReturnValue(mockModel);
      vi.mocked(createAgent).mockReturnValue({
        invoke: vi.fn().mockResolvedValue(mockResponse),
      } as any);

      await ai.call({
        aiModel: "gpt-5-nano",
        messages: mockMessages,
        modelConfig: {
          reasoningEffort: "medium",
        },
      });

      expect(AIModels.gpt).toHaveBeenCalledWith({
        model: "gpt-5-nano",
        apiKey: mockTokens.openAIApiKey,
        reasoningEffort: "medium",
      });
    });

    it("deve exibir warning quando reasoningEffort é passado com modelo Gemini", async () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const mockModel = {} as any;
      const mockMessages = [AIMessages.human("Teste")];
      const mockResponse = {
        messages: [{ content: "Resposta" } as any],
      };

      vi.mocked(AIModels.gemini).mockReturnValue(mockModel);
      vi.mocked(createAgent).mockReturnValue({
        invoke: vi.fn().mockResolvedValue(mockResponse),
      } as any);

      const aiWithGemini = new AI({
        openAIApiKey: "test-key",
        googleGeminiToken: "test-gemini-token",
      });

      await aiWithGemini.call({
        aiModel: "gemini-2.5-flash",
        messages: mockMessages,
        modelConfig: {
          reasoningEffort: "high",
        },
      });

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('O modelo "gemini-2.5-flash" não suporta reasoningEffort'),
      );
      expect(AIModels.gemini).toHaveBeenCalledWith(
        expect.not.objectContaining({ reasoningEffort: expect.anything() }),
      );
      warnSpy.mockRestore();
    });

    it("deve exibir warning quando reasoningEffort é passado com OpenRouter não-OpenAI", async () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const mockModel = {} as any;
      const mockMessages = [AIMessages.human("Teste")];
      const mockResponse = {
        messages: [{ content: "Resposta" } as any],
      };

      vi.mocked(AIModels.openrouter).mockReturnValue(mockModel);
      vi.mocked(createAgent).mockReturnValue({
        invoke: vi.fn().mockResolvedValue(mockResponse),
      } as any);

      const aiWithOpenRouter = new AI({
        openRouterApiKey: "test-openrouter-key",
      });

      await aiWithOpenRouter.call({
        aiModel: "openrouter/google/gemini-2.5-flash",
        messages: mockMessages,
        modelConfig: {
          reasoningEffort: "high",
        },
      });

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          'O modelo "openrouter/google/gemini-2.5-flash" não suporta reasoningEffort',
        ),
      );
      warnSpy.mockRestore();
    });

    it("deve lançar erro quando memory está ativo e threadId não é fornecido", async () => {
      const aiWithMemory = new AI({
        openAIApiKey: "test-key",
        memory: { type: "memory" },
      });

      await expect(
        aiWithMemory.call({
          aiModel: "gpt-4",
          messages: [AIMessages.human("Olá")],
        }),
      ).rejects.toThrow("threadId é obrigatório");
    });

    it("deve fazer fallback para o próximo modelo quando o principal falhar", async () => {
      const mockModel = {} as any;
      const mockMessages = [AIMessages.human("Teste")];
      const mockResponse = {
        messages: [{ content: "Resposta do fallback" } as any],
      };
      const error = new Error("Modelo principal falhou");

      vi.mocked(AIModels.gpt).mockReturnValue(mockModel);
      vi.mocked(AIModels.gemini).mockReturnValue(mockModel);

      let createCount = 0;
      vi.mocked(createAgent).mockImplementation(() => {
        createCount++;
        return {
          invoke: vi.fn().mockImplementation(() => {
            if (createCount === 1) return Promise.reject(error);
            return Promise.resolve(mockResponse);
          }),
        } as any;
      });

      const result = await ai.call({
        aiModel: "gpt-4",
        messages: mockMessages,
        aiModelsFallback: ["gemini-2.5-flash"],
      });

      expect(createAgent).toHaveBeenCalledTimes(2);
      expect(AIModels.gpt).toHaveBeenCalled();
      expect(AIModels.gemini).toHaveBeenCalled();
      expect(result.text).toBe("Resposta do fallback");
    });

    it("deve fazer fallback com modelo OpenRouter na lista", async () => {
      const mockModel = {} as any;
      const mockMessages = [AIMessages.human("Teste")];
      const mockResponse = {
        messages: [{ content: "Resposta OpenRouter" } as any],
      };
      const error = new Error("GPT falhou");

      const aiWithOpenRouter = new AI({
        openAIApiKey: "test-key",
        openRouterApiKey: "test-openrouter-key",
      });

      vi.mocked(AIModels.gpt).mockReturnValue(mockModel);
      vi.mocked(AIModels.openrouter).mockReturnValue(mockModel);

      let callCount = 0;
      vi.mocked(createAgent).mockImplementation(() => {
        callCount++;
        return {
          invoke: vi.fn().mockImplementation(() => {
            if (callCount === 1) return Promise.reject(error);
            return Promise.resolve(mockResponse);
          }),
        } as any;
      });

      const result = await aiWithOpenRouter.call({
        aiModel: "gpt-4",
        messages: mockMessages,
        aiModelsFallback: ["openrouter/openai/gpt-5-nano"],
      });

      expect(AIModels.openrouter).toHaveBeenCalledWith(
        expect.objectContaining({
          model: "openai/gpt-5-nano",
          apiKey: "test-openrouter-key",
        }),
      );
      expect(result.text).toBe("Resposta OpenRouter");
    });

    it("deve usar aiModelsFallback do construtor quando não passado no método", async () => {
      const mockModel = {} as any;
      const mockMessages = [AIMessages.human("Teste")];
      const mockResponse = {
        messages: [{ content: "Resposta fallback default" } as any],
      };
      const error = new Error("Modelo principal falhou");

      const aiWithDefaultFallback = new AI({
        openAIApiKey: "test-key",
        aiModelsFallback: ["gemini-2.5-flash"],
      });

      vi.mocked(AIModels.gpt).mockReturnValue(mockModel);
      vi.mocked(AIModels.gemini).mockReturnValue(mockModel);

      let createCount = 0;
      vi.mocked(createAgent).mockImplementation(() => {
        createCount++;
        return {
          invoke: vi.fn().mockImplementation(() => {
            if (createCount === 1) return Promise.reject(error);
            return Promise.resolve(mockResponse);
          }),
        } as any;
      });

      const result = await aiWithDefaultFallback.call({
        aiModel: "gpt-4",
        messages: mockMessages,
      });

      expect(createAgent).toHaveBeenCalledTimes(2);
      expect(result.text).toBe("Resposta fallback default");
    });

    it("deve usar aiModelsFallback do método quando passado, sobrescrevendo o do construtor", async () => {
      const mockModel = {} as any;
      const mockMessages = [AIMessages.human("Teste")];
      const mockResponse = {
        messages: [{ content: "Resposta fallback do método" } as any],
      };
      const error = new Error("Modelo principal falhou");

      const aiWithDefaultFallback = new AI({
        openAIApiKey: "test-key",
        openRouterApiKey: "test-openrouter-key",
        aiModelsFallback: ["gemini-2.5-flash"],
      });

      vi.mocked(AIModels.gpt).mockReturnValue(mockModel);
      vi.mocked(AIModels.openrouter).mockReturnValue(mockModel);

      let createCount = 0;
      vi.mocked(createAgent).mockImplementation(() => {
        createCount++;
        return {
          invoke: vi.fn().mockImplementation(() => {
            if (createCount === 1) return Promise.reject(error);
            return Promise.resolve(mockResponse);
          }),
        } as any;
      });

      const result = await aiWithDefaultFallback.call({
        aiModel: "gpt-4",
        messages: mockMessages,
        aiModelsFallback: ["openrouter/openai/gpt-5-nano"],
      });

      expect(AIModels.openrouter).toHaveBeenCalled();
      expect(result.text).toBe("Resposta fallback do método");
    });

    it("deve lançar exceção quando todos os modelos falharem", async () => {
      const mockModel = {} as any;
      const mockMessages = [AIMessages.human("Teste")];
      const error = new Error("Todos os modelos falharam");

      vi.mocked(AIModels.gpt).mockReturnValue(mockModel);
      vi.mocked(AIModels.gemini).mockReturnValue(mockModel);

      vi.mocked(createAgent).mockReturnValue({
        invoke: vi.fn().mockRejectedValue(error),
      } as any);

      await expect(
        ai.call({
          aiModel: "gpt-4",
          messages: mockMessages,
          aiModelsFallback: ["gemini-2.5-flash"],
        }),
      ).rejects.toThrow("Todos os modelos falharam");

      expect(createAgent).toHaveBeenCalledTimes(2);
    });

    it("deve passar checkpointer e thread_id quando memory e threadId são fornecidos", async () => {
      const mockCheckpointer = {};
      vi.mocked(AIMemory).mockImplementation(function () {
        return {
          getCheckpointer: vi.fn().mockResolvedValue(mockCheckpointer),
          setAgent: vi.fn(),
        } as any;
      });

      const aiWithMemory = new AI({
        openAIApiKey: "test-key",
        memory: { type: "memory" },
      });

      const mockModel = {} as any;
      const mockMessages = [AIMessages.human("Olá")];
      const mockResponse = {
        messages: [mockMessages[0], { content: "Resposta" } as any],
      };

      vi.mocked(AIModels.gpt).mockReturnValue(mockModel);
      const mockInvoke = vi.fn().mockResolvedValue(mockResponse);
      vi.mocked(createAgent).mockReturnValue({ invoke: mockInvoke } as any);

      await aiWithMemory.call({
        aiModel: "gpt-4",
        messages: mockMessages,
        threadId: "thread-123",
      });

      const callArgs = vi.mocked(createAgent).mock.calls[0][0];
      expect(callArgs.checkpointer).toBe(mockCheckpointer);
      expect(mockInvoke).toHaveBeenCalledWith(
        { messages: mockMessages },
        { configurable: { thread_id: "thread-123" } },
      );
    });
  });

  describe("callStructuredOutput", () => {
    it("deve chamar o agente com outputSchema e retornar resposta estruturada", async () => {
      const mockModel = {} as any;
      const mockMessages = [AIMessages.human("Teste")];
      const outputSchema = z.object({
        name: z.string(),
        age: z.number(),
      });
      const mockStructuredResponse = { name: "João", age: 30 };
      const mockResponse = {
        structuredResponse: mockStructuredResponse,
      };

      vi.mocked(AIModels.gpt).mockReturnValue(mockModel);
      vi.mocked(createAgent).mockReturnValue({
        invoke: vi.fn().mockResolvedValue(mockResponse),
      } as any);

      const result = await ai.callStructuredOutput({
        aiModel: "gpt-4",
        messages: mockMessages,
        outputSchema,
      });

      expect(createAgent).toHaveBeenCalled();
      expect(result.response).toEqual(mockStructuredResponse);
    });

    it("deve fazer fallback no callStructuredOutput quando o modelo principal falhar", async () => {
      const mockModel = {} as any;
      const mockMessages = [AIMessages.human("Teste")];
      const outputSchema = z.object({ name: z.string() });
      const mockStructuredResponse = { name: "Fallback" };
      const error = new Error("Modelo principal falhou");

      vi.mocked(AIModels.gpt).mockReturnValue(mockModel);
      vi.mocked(AIModels.gemini).mockReturnValue(mockModel);

      let createCount = 0;
      vi.mocked(createAgent).mockImplementation(() => {
        createCount++;
        return {
          invoke: vi.fn().mockImplementation(() => {
            if (createCount === 1) return Promise.reject(error);
            return Promise.resolve({
              structuredResponse: mockStructuredResponse,
            });
          }),
        } as any;
      });

      const result = await ai.callStructuredOutput({
        aiModel: "gpt-4",
        messages: mockMessages,
        outputSchema,
        aiModelsFallback: ["gemini-2.5-flash"],
      });

      expect(createAgent).toHaveBeenCalledTimes(2);
      expect(result.response).toEqual(mockStructuredResponse);
    });

    it("deve validar o schema e lançar erro se inválido", async () => {
      const mockModel = {} as any;
      const mockMessages = [AIMessages.human("Teste")];
      const outputSchema = z.object({
        name: z.string(),
        age: z.number(),
      });
      const mockStructuredResponse = { name: "João", age: "30" }; // age deveria ser number

      vi.mocked(AIModels.gpt).mockReturnValue(mockModel);
      vi.mocked(createAgent).mockReturnValue({
        invoke: vi.fn().mockResolvedValue({
          structuredResponse: mockStructuredResponse,
        }),
      } as any);

      await expect(
        ai.callStructuredOutput({
          aiModel: "gpt-4",
          messages: mockMessages,
          outputSchema,
        }),
      ).rejects.toThrow();
    });
  });

  describe("getRawAgent", () => {
    it("deve retornar um agente sem outputSchema", async () => {
      const mockModel = {} as any;
      const mockMessages = [AIMessages.human("Teste")];
      const mockAgent = {
        invoke: vi.fn(),
      };

      vi.mocked(AIModels.gpt).mockReturnValue(mockModel);
      vi.mocked(createAgent).mockReturnValue(mockAgent as any);

      const result = await ai.getRawAgent({
        aiModel: "gpt-4",
        messages: mockMessages,
      });

      expect(createAgent).toHaveBeenCalled();
      expect(result.agent).toBe(mockAgent);
    });

    it("deve retornar um agente com outputSchema quando fornecido", async () => {
      const mockModel = {} as any;
      const mockMessages = [AIMessages.human("Teste")];
      const outputSchema = z.object({ result: z.string() });
      const mockAgent = {
        invoke: vi.fn(),
      };

      vi.mocked(AIModels.gpt).mockReturnValue(mockModel);
      vi.mocked(createAgent).mockReturnValue(mockAgent as any);

      const result = await ai.getRawAgent(
        {
          aiModel: "gpt-4",
          messages: mockMessages,
        },
        outputSchema,
      );

      expect(createAgent).toHaveBeenCalled();
      expect(result.agent).toBe(mockAgent);
    });
  });

  describe("compatibilidade com aliases Langchain (deprecated)", () => {
    it("deve permitir importar Langchain como alias de AI", async () => {
      const { Langchain } = await import("../../src/index.js");
      expect(Langchain).toBe(AI);
    });

    it("deve permitir importar LangchainMessages como alias de AIMessages", async () => {
      const { LangchainMessages } = await import("../../src/index.js");
      const { AIMessages } = await import("../../src/index.js");
      expect(LangchainMessages).toBe(AIMessages);
    });

    it("deve permitir importar LangchainModels como alias de AIModels", async () => {
      const { LangchainModels } = await import("../../src/index.js");
      const { AIModels } = await import("../../src/index.js");
      expect(LangchainModels).toBe(AIModels);
    });
  });
});
