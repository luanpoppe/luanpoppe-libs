import {
  AIModels,
  DEFAULT_OLLAMA_BASE_URL,
  LLMModelConfig,
  resolveOpenRouterProvider,
} from "../../../src/langchain/models";
import { ChatOpenAI } from "@langchain/openai";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatOllama } from "@langchain/ollama";

// Mock das dependências
vi.mock("@langchain/openai", () => ({
  ChatOpenAI: vi.fn(),
}));

vi.mock("@langchain/google-genai", () => ({
  ChatGoogleGenerativeAI: vi.fn(),
}));

vi.mock("@langchain/ollama", () => ({
  ChatOllama: vi.fn(),
}));

describe("AIModels", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("gpt", () => {
    it("deve criar uma instância do ChatOpenAI com configurações básicas", () => {
      const config: LLMModelConfig = {
        model: "gpt-4",
        apiKey: "test-api-key",
      };

      AIModels.gpt(config);

      expect(ChatOpenAI).toHaveBeenCalledWith({
        model: "gpt-4",
        apiKey: "test-api-key",
      });
    });

    it("deve criar uma instância do ChatOpenAI com maxTokens", () => {
      const config: LLMModelConfig = {
        model: "gpt-4o",
        apiKey: "test-api-key",
        maxTokens: 1000,
      };

      AIModels.gpt(config);

      expect(ChatOpenAI).toHaveBeenCalledWith({
        model: "gpt-4o",
        apiKey: "test-api-key",
        maxTokens: 1000,
      });
    });

    it("deve criar uma instância do ChatOpenAI com temperature", () => {
      const config: LLMModelConfig = {
        model: "gpt-4",
        apiKey: "test-api-key",
        temperature: 0.7,
      };

      AIModels.gpt(config);

      expect(ChatOpenAI).toHaveBeenCalledWith({
        model: "gpt-4",
        apiKey: "test-api-key",
        temperature: 0.7,
      });
    });

    it("deve criar uma instância do ChatOpenAI com todas as opções", () => {
      const config: LLMModelConfig = {
        model: "gpt-4o",
        apiKey: "test-api-key",
        maxTokens: 2000,
        temperature: 0.5,
      };

      AIModels.gpt(config);

      expect(ChatOpenAI).toHaveBeenCalledWith({
        model: "gpt-4o",
        apiKey: "test-api-key",
        maxTokens: 2000,
        temperature: 0.5,
      });
    });

    it("deve lançar erro quando apiKey não é fornecida", () => {
      const config: LLMModelConfig = {
        model: "gpt-4",
      };

      expect(() => AIModels.gpt(config)).toThrow(
        "OpenAI API key is not passed in the model parameters"
      );
    });

    it("deve lançar erro quando apiKey é undefined", () => {
      const config: LLMModelConfig = {
        model: "gpt-4",
        apiKey: undefined,
      };

      expect(() => AIModels.gpt(config)).toThrow(
        "OpenAI API key is not passed in the model parameters"
      );
    });

    it("deve criar uma instância do ChatOpenAI com reasoningEffort", () => {
      const config: LLMModelConfig = {
        model: "gpt-5-nano",
        apiKey: "test-api-key",
        reasoningEffort: "high",
      };

      AIModels.gpt(config);

      expect(ChatOpenAI).toHaveBeenCalledWith({
        model: "gpt-5-nano",
        apiKey: "test-api-key",
        modelKwargs: { reasoning_effort: "high" },
      });
    });
  });

  describe("gemini", () => {
    it("deve criar uma instância do ChatGoogleGenerativeAI com configurações básicas", () => {
      const config: LLMModelConfig = {
        model: "gemini-2.5-flash",
        apiKey: "test-api-key",
      };

      AIModels.gemini(config);

      expect(ChatGoogleGenerativeAI).toHaveBeenCalledWith({
        model: "gemini-2.5-flash",
        apiKey: "test-api-key",
      });
    });

    it("deve criar uma instância do ChatGoogleGenerativeAI com maxTokens", () => {
      const config: LLMModelConfig = {
        model: "gemini-2.5-pro",
        apiKey: "test-api-key",
        maxTokens: 1500,
      };

      AIModels.gemini(config);

      expect(ChatGoogleGenerativeAI).toHaveBeenCalledWith({
        model: "gemini-2.5-pro",
        apiKey: "test-api-key",
        maxOutputTokens: 1500,
      });
    });

    it("deve criar uma instância do ChatGoogleGenerativeAI com temperature", () => {
      const config: LLMModelConfig = {
        model: "gemini-3-flash",
        apiKey: "test-api-key",
        temperature: 0.8,
      };

      AIModels.gemini(config);

      expect(ChatGoogleGenerativeAI).toHaveBeenCalledWith({
        model: "gemini-3-flash",
        apiKey: "test-api-key",
        temperature: 0.8,
      });
    });

    it("deve criar uma instância do ChatGoogleGenerativeAI com todas as opções", () => {
      const config: LLMModelConfig = {
        model: "gemini-3-pro",
        apiKey: "test-api-key",
        maxTokens: 3000,
        temperature: 0.6,
      };

      AIModels.gemini(config);

      expect(ChatGoogleGenerativeAI).toHaveBeenCalledWith({
        model: "gemini-3-pro",
        apiKey: "test-api-key",
        maxOutputTokens: 3000,
        temperature: 0.6,
      });
    });

    it("deve lançar erro quando apiKey não é fornecida", () => {
      const config: LLMModelConfig = {
        model: "gemini-2.5-flash",
      };

      expect(() => AIModels.gemini(config)).toThrow(
        "Google Gemini API key is not passed in the model parameters"
      );
    });

    it("deve lançar erro quando apiKey é undefined", () => {
      const config: LLMModelConfig = {
        model: "gemini-2.5-flash",
        apiKey: undefined,
      };

      expect(() => AIModels.gemini(config)).toThrow(
        "Google Gemini API key is not passed in the model parameters"
      );
    });
  });

  describe("resolveOpenRouterProvider", () => {
    it("deve retornar only deepseek para modelos deepseek/ sem config", () => {
      expect(
        resolveOpenRouterProvider("deepseek/deepseek-v3.2", {}),
      ).toEqual({ only: ["deepseek"] });
    });

    it("não deve aplicar default para modelos que não são deepseek/", () => {
      expect(
        resolveOpenRouterProvider("openai/gpt-5-nano", {}),
      ).toBeUndefined();
    });

    it("deve retornar undefined quando openRouterAllowAllProviders é true", () => {
      expect(
        resolveOpenRouterProvider("deepseek/deepseek-v3.2", {
          openRouterAllowAllProviders: true,
        }),
      ).toBeUndefined();
    });

    it("deve usar openRouterProvider explícito em vez do default", () => {
      const custom = { only: ["deepinfra"] };
      expect(
        resolveOpenRouterProvider("deepseek/deepseek-r1", {
          openRouterProvider: custom,
        }),
      ).toEqual(custom);
    });
  });

  describe("openrouter", () => {
    it("deve criar ChatOpenAI com configurações básicas", () => {
      const config: LLMModelConfig = {
        model: "openai/gpt-5-nano",
        apiKey: "test-openrouter-key",
      };

      AIModels.openrouter(config);

      expect(ChatOpenAI).toHaveBeenCalledWith({
        model: "openai/gpt-5-nano",
        apiKey: "test-openrouter-key",
        configuration: {
          baseURL: "https://openrouter.ai/api/v1",
        },
      });
    });

    it("deve aplicar provider only deepseek por padrão em modelos deepseek/", () => {
      const config: LLMModelConfig = {
        model: "deepseek/deepseek-v3.2",
        apiKey: "test-openrouter-key",
      };

      AIModels.openrouter(config);

      expect(ChatOpenAI).toHaveBeenCalledWith(
        expect.objectContaining({
          modelKwargs: { provider: { only: ["deepseek"] } },
        }),
      );
    });

    it("não deve enviar provider em modelos não-deepseek", () => {
      const config: LLMModelConfig = {
        model: "openai/gpt-5-nano",
        apiKey: "test-openrouter-key",
      };

      AIModels.openrouter(config);

      expect(ChatOpenAI).toHaveBeenCalledWith(
        expect.not.objectContaining({
          modelKwargs: expect.anything(),
        }),
      );
    });

    it("não deve aplicar default deepseek quando openRouterAllowAllProviders é true", () => {
      const config: LLMModelConfig = {
        model: "deepseek/deepseek-v3.2",
        apiKey: "test-openrouter-key",
        openRouterAllowAllProviders: true,
      };

      AIModels.openrouter(config);

      expect(ChatOpenAI).toHaveBeenCalledWith(
        expect.not.objectContaining({
          modelKwargs: expect.anything(),
        }),
      );
    });

    it("deve enviar openRouterProvider customizado", () => {
      const provider = {
        only: ["deepinfra", "fireworks"],
        max_price: { prompt: 0.5, completion: 1 },
        sort: "price" as const,
      };

      AIModels.openrouter({
        model: "deepseek/deepseek-r1",
        apiKey: "test-openrouter-key",
        openRouterProvider: provider,
      });

      expect(ChatOpenAI).toHaveBeenCalledWith(
        expect.objectContaining({
          modelKwargs: { provider },
        }),
      );
    });

    it("deve mesclar provider com reasoningEffort", () => {
      AIModels.openrouter({
        model: "deepseek/deepseek-r1",
        apiKey: "test-openrouter-key",
        reasoningEffort: "high",
        openRouterProvider: { only: ["deepseek"] },
      });

      expect(ChatOpenAI).toHaveBeenCalledWith(
        expect.objectContaining({
          modelKwargs: {
            reasoning_effort: "high",
            provider: { only: ["deepseek"] },
          },
        }),
      );
    });

    it("deve lançar erro quando apiKey não é fornecida", () => {
      expect(() =>
        AIModels.openrouter({ model: "openai/gpt-5-nano" }),
      ).toThrow("OpenRouter API key is not passed in the model parameters");
    });
  });

  describe("ollama", () => {
    it("deve criar ChatOllama com configurações básicas e baseUrl padrão", () => {
      AIModels.ollama({ model: "llama3.2" });

      expect(ChatOllama).toHaveBeenCalledWith({
        model: "llama3.2",
        baseUrl: DEFAULT_OLLAMA_BASE_URL,
      });
    });

    it("deve criar ChatOllama com baseUrl, temperature e numCtx customizados", () => {
      AIModels.ollama({
        model: "qwen2.5:7b",
        baseUrl: "http://custom:11434",
        temperature: 0.2,
        numCtx: 8192,
        maxTokens: 512,
      });

      expect(ChatOllama).toHaveBeenCalledWith({
        model: "qwen2.5:7b",
        baseUrl: "http://custom:11434",
        temperature: 0.2,
        numCtx: 8192,
        numPredict: 512,
      });
    });
  });

  describe("openaiCompatible", () => {
    it("deve criar ChatOpenAI com baseURL local", () => {
      AIModels.openaiCompatible({
        model: "meta-llama/Llama-3.2-3B-Instruct",
        baseURL: "http://localhost:1234/v1",
      });

      expect(ChatOpenAI).toHaveBeenCalledWith({
        model: "meta-llama/Llama-3.2-3B-Instruct",
        apiKey: "not-needed",
        configuration: {
          baseURL: "http://localhost:1234/v1",
        },
      });
    });

    it("deve aceitar apiKey e parâmetros opcionais", () => {
      AIModels.openaiCompatible({
        model: "my-model",
        baseURL: "http://127.0.0.1:11434/v1",
        apiKey: "lm-studio",
        maxTokens: 1000,
        temperature: 0.5,
      });

      expect(ChatOpenAI).toHaveBeenCalledWith({
        model: "my-model",
        apiKey: "lm-studio",
        maxTokens: 1000,
        temperature: 0.5,
        configuration: {
          baseURL: "http://127.0.0.1:11434/v1",
        },
      });
    });

    it("deve lançar erro quando baseURL não é fornecida", () => {
      expect(() =>
        AIModels.openaiCompatible({ model: "x", baseURL: "" }),
      ).toThrow("baseURL é obrigatório");
    });
  });
});
