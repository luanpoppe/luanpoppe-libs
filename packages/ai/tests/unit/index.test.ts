import { AI } from "../../src/index";
import { AIModels } from "../../src/langchain/models";
import { createAgent } from "langchain";
import { AIMessages } from "../../src/langchain/messages";
import z from "zod";

// Mock das dependências
vi.mock("langchain", async () => {
  const actual = await vi.importActual("langchain");
  return {
    ...actual,
    createAgent: vi.fn(),
    modelRetryMiddleware: vi.fn((config) => ({ type: "retry", ...config })),
    modelFallbackMiddleware: vi.fn((...models) => ({
      type: "fallback",
      models,
    })),
  };
});

vi.mock("../../src/langchain/models", () => ({
  AIModels: {
    gpt: vi.fn(),
    gemini: vi.fn(),
  },
}));

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

      await ai.call({
        aiModel: "gpt-4",
        messages: mockMessages,
        maxRetries: 5,
      });

      const callArgs = vi.mocked(createAgent).mock.calls[0][0];
      expect(callArgs.middleware).toBeDefined();
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
        })
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
        })
      ).rejects.toThrow();
    });
  });

  describe("getRawAgent", () => {
    it("deve retornar um agente sem outputSchema", () => {
      const mockModel = {} as any;
      const mockMessages = [AIMessages.human("Teste")];
      const mockAgent = {
        invoke: vi.fn(),
      };

      vi.mocked(AIModels.gpt).mockReturnValue(mockModel);
      vi.mocked(createAgent).mockReturnValue(mockAgent as any);

      const result = ai.getRawAgent({
        aiModel: "gpt-4",
        messages: mockMessages,
      });

      expect(createAgent).toHaveBeenCalled();
      expect(result.agent).toBe(mockAgent);
    });

    it("deve retornar um agente com outputSchema quando fornecido", () => {
      const mockModel = {} as any;
      const mockMessages = [AIMessages.human("Teste")];
      const outputSchema = z.object({ result: z.string() });
      const mockAgent = {
        invoke: vi.fn(),
      };

      vi.mocked(AIModels.gpt).mockReturnValue(mockModel);
      vi.mocked(createAgent).mockReturnValue(mockAgent as any);

      const result = ai.getRawAgent(
        {
          aiModel: "gpt-4",
          messages: mockMessages,
        },
        outputSchema
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
