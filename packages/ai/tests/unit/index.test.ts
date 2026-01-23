import { Langchain } from "../../src/index";
import { LangchainModels } from "../../src/langchain/models";
import { createAgent } from "langchain";
import { LangchainMessages } from "../../src/langchain/messages";
import z from "zod";

// Mock das dependências
vi.mock("langchain", async () => {
  const actual = await vi.importActual("langchain");
  return {
    ...actual,
    createAgent: vi.fn(),
    modelRetryMiddleware: vi.fn((config) => ({ type: "retry", ...config })),
    modelFallbackMiddleware: vi.fn((...models) => ({ type: "fallback", models })),
  };
});

vi.mock("../../src/langchain/models", () => ({
  LangchainModels: {
    gpt: vi.fn(),
    gemini: vi.fn(),
  },
}));

describe("Langchain", () => {
  let langchain: Langchain;
  const mockTokens = {
    openAIApiKey: "test-openai-key",
    googleGeminiToken: "test-gemini-token",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    langchain = new Langchain(mockTokens);
  });

  describe("constructor", () => {
    it("deve criar uma instância com tokens fornecidos", () => {
      const instance = new Langchain(mockTokens);
      expect(instance).toBeInstanceOf(Langchain);
    });

    it("deve criar uma instância com apenas openAIApiKey", () => {
      const instance = new Langchain({ openAIApiKey: "test-key" });
      expect(instance).toBeInstanceOf(Langchain);
    });

    it("deve criar uma instância com apenas googleGeminiToken", () => {
      const instance = new Langchain({ googleGeminiToken: "test-token" });
      expect(instance).toBeInstanceOf(Langchain);
    });
  });

  describe("call", () => {
    it("deve chamar o agente e retornar a resposta correta", async () => {
      const mockModel = {} as any;
      const mockMessages = [
        LangchainMessages.human("Olá"),
      ];
      const mockResponse = {
        messages: [
          mockMessages[0],
          { content: "Olá! Como posso ajudar?" } as any,
        ],
      };

      vi.mocked(LangchainModels.gpt).mockReturnValue(mockModel);
      vi.mocked(createAgent).mockReturnValue({
        invoke: vi.fn().mockResolvedValue(mockResponse),
      } as any);

      const result = await langchain.call({
        aiModel: "gpt-4",
        messages: mockMessages,
      });

      expect(createAgent).toHaveBeenCalled();
      expect(result.text).toBe("Olá! Como posso ajudar?");
      expect(result.messages).toEqual(mockResponse.messages);
    });

    it("deve retornar mensagem padrão quando resposta está vazia", async () => {
      const mockModel = {} as any;
      const mockMessages = [LangchainMessages.human("Teste")];
      const mockResponse = {
        messages: [
          mockMessages[0],
          { content: null } as any, // Última mensagem sem conteúdo
        ],
      };

      vi.mocked(LangchainModels.gpt).mockReturnValue(mockModel);
      vi.mocked(createAgent).mockReturnValue({
        invoke: vi.fn().mockResolvedValue(mockResponse),
      } as any);

      const result = await langchain.call({
        aiModel: "gpt-4",
        messages: mockMessages,
      });

      expect(result.text).toBe("Empty response from the model");
    });

    it("deve usar systemPrompt quando fornecido", async () => {
      const mockModel = {} as any;
      const mockMessages = [LangchainMessages.human("Teste")];
      const mockResponse = {
        messages: [{ content: "Resposta" } as any],
      };

      vi.mocked(LangchainModels.gpt).mockReturnValue(mockModel);
      vi.mocked(createAgent).mockReturnValue({
        invoke: vi.fn().mockResolvedValue(mockResponse),
      } as any);

      await langchain.call({
        aiModel: "gpt-4",
        messages: mockMessages,
        systemPrompt: "Você é um assistente útil",
      });

      const callArgs = vi.mocked(createAgent).mock.calls[0][0];
      expect(callArgs.systemPrompt).toBe("Você é um assistente útil");
    });

    it("deve usar maxRetries padrão quando não fornecido", async () => {
      const mockModel = {} as any;
      const mockMessages = [LangchainMessages.human("Teste")];
      const mockResponse = {
        messages: [{ content: "Resposta" } as any],
      };

      vi.mocked(LangchainModels.gpt).mockReturnValue(mockModel);
      vi.mocked(createAgent).mockReturnValue({
        invoke: vi.fn().mockResolvedValue(mockResponse),
      } as any);

      await langchain.call({
        aiModel: "gpt-4",
        messages: mockMessages,
      });

      const callArgs = vi.mocked(createAgent).mock.calls[0][0];
      expect(callArgs.middleware).toBeDefined();
      expect(callArgs.middleware?.length).toBeGreaterThan(0);
    });

    it("deve usar maxRetries customizado quando fornecido", async () => {
      const mockModel = {} as any;
      const mockMessages = [LangchainMessages.human("Teste")];
      const mockResponse = {
        messages: [{ content: "Resposta" } as any],
      };

      vi.mocked(LangchainModels.gpt).mockReturnValue(mockModel);
      vi.mocked(createAgent).mockReturnValue({
        invoke: vi.fn().mockResolvedValue(mockResponse),
      } as any);

      await langchain.call({
        aiModel: "gpt-4",
        messages: mockMessages,
        maxRetries: 5,
      });

      const callArgs = vi.mocked(createAgent).mock.calls[0][0];
      expect(callArgs.middleware).toBeDefined();
    });

    it("deve usar modelo GPT quando aiModel começa com 'gpt'", async () => {
      const mockModel = {} as any;
      const mockMessages = [LangchainMessages.human("Teste")];
      const mockResponse = {
        messages: [{ content: "Resposta" } as any],
      };

      vi.mocked(LangchainModels.gpt).mockReturnValue(mockModel);
      vi.mocked(createAgent).mockReturnValue({
        invoke: vi.fn().mockResolvedValue(mockResponse),
      } as any);

      await langchain.call({
        aiModel: "gpt-4o",
        messages: mockMessages,
      });

      expect(LangchainModels.gpt).toHaveBeenCalledWith({
        model: "gpt-4o",
        apiKey: mockTokens.openAIApiKey,
      });
    });

    it("deve usar modelo Gemini quando aiModel começa com 'gemini'", async () => {
      const mockModel = {} as any;
      const mockMessages = [LangchainMessages.human("Teste")];
      const mockResponse = {
        messages: [{ content: "Resposta" } as any],
      };

      vi.mocked(LangchainModels.gemini).mockReturnValue(mockModel);
      vi.mocked(createAgent).mockReturnValue({
        invoke: vi.fn().mockResolvedValue(mockResponse),
      } as any);

      await langchain.call({
        aiModel: "gemini-2.5-flash",
        messages: mockMessages,
      });

      expect(LangchainModels.gemini).toHaveBeenCalledWith({
        model: "gemini-2.5-flash",
        apiKey: mockTokens.googleGeminiToken,
      });
    });

    it("deve lançar erro quando modelo não é suportado", async () => {
      const mockMessages = [LangchainMessages.human("Teste")];

      await expect(
        langchain.call({
          aiModel: "unsupported-model" as any,
          messages: mockMessages,
        })
      ).rejects.toThrow("Model not supported");
    });

    it("deve passar modelConfig quando fornecido", async () => {
      const mockModel = {} as any;
      const mockMessages = [LangchainMessages.human("Teste")];
      const mockResponse = {
        messages: [{ content: "Resposta" } as any],
      };

      vi.mocked(LangchainModels.gpt).mockReturnValue(mockModel);
      vi.mocked(createAgent).mockReturnValue({
        invoke: vi.fn().mockResolvedValue(mockResponse),
      } as any);

      await langchain.call({
        aiModel: "gpt-4",
        messages: mockMessages,
        modelConfig: {
          maxTokens: 2000,
          temperature: 0.7,
        },
      });

      expect(LangchainModels.gpt).toHaveBeenCalledWith({
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
      const mockMessages = [LangchainMessages.human("Teste")];
      const outputSchema = z.object({
        name: z.string(),
        age: z.number(),
      });
      const mockStructuredResponse = { name: "João", age: 30 };
      const mockResponse = {
        structuredResponse: mockStructuredResponse,
      };

      vi.mocked(LangchainModels.gpt).mockReturnValue(mockModel);
      vi.mocked(createAgent).mockReturnValue({
        invoke: vi.fn().mockResolvedValue(mockResponse),
      } as any);

      const result = await langchain.callStructuredOutput({
        aiModel: "gpt-4",
        messages: mockMessages,
        outputSchema,
      });

      expect(createAgent).toHaveBeenCalled();
      expect(result.response).toEqual(mockStructuredResponse);
    });

    it("deve validar o schema e lançar erro se inválido", async () => {
      const mockModel = {} as any;
      const mockMessages = [LangchainMessages.human("Teste")];
      const outputSchema = z.object({
        name: z.string(),
        age: z.number(),
      });
      const mockStructuredResponse = { name: "João", age: "30" }; // age deveria ser number

      vi.mocked(LangchainModels.gpt).mockReturnValue(mockModel);
      vi.mocked(createAgent).mockReturnValue({
        invoke: vi.fn().mockResolvedValue({
          structuredResponse: mockStructuredResponse,
        }),
      } as any);

      await expect(
        langchain.callStructuredOutput({
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
      const mockMessages = [LangchainMessages.human("Teste")];
      const mockAgent = {
        invoke: vi.fn(),
      };

      vi.mocked(LangchainModels.gpt).mockReturnValue(mockModel);
      vi.mocked(createAgent).mockReturnValue(mockAgent as any);

      const result = langchain.getRawAgent({
        aiModel: "gpt-4",
        messages: mockMessages,
      });

      expect(createAgent).toHaveBeenCalled();
      expect(result.agent).toBe(mockAgent);
    });

    it("deve retornar um agente com outputSchema quando fornecido", () => {
      const mockModel = {} as any;
      const mockMessages = [LangchainMessages.human("Teste")];
      const outputSchema = z.object({ result: z.string() });
      const mockAgent = {
        invoke: vi.fn(),
      };

      vi.mocked(LangchainModels.gpt).mockReturnValue(mockModel);
      vi.mocked(createAgent).mockReturnValue(mockAgent as any);

      const result = langchain.getRawAgent(
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
});
