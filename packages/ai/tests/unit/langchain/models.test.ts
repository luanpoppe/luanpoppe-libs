import { LangchainModels, LLMModelConfig } from "../../../src/langchain/models";
import { ChatOpenAI } from "@langchain/openai";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

// Mock das dependências
vi.mock("@langchain/openai", () => ({
  ChatOpenAI: vi.fn(),
}));

vi.mock("@langchain/google-genai", () => ({
  ChatGoogleGenerativeAI: vi.fn(),
}));

describe("LangchainModels", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("gpt", () => {
    it("deve criar uma instância do ChatOpenAI com configurações básicas", () => {
      const config: LLMModelConfig = {
        model: "gpt-4",
        apiKey: "test-api-key",
      };

      LangchainModels.gpt(config);

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

      LangchainModels.gpt(config);

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

      LangchainModels.gpt(config);

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

      LangchainModels.gpt(config);

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

      expect(() => LangchainModels.gpt(config)).toThrow(
        "OpenAI API key is not passed in the model parameters"
      );
    });

    it("deve lançar erro quando apiKey é undefined", () => {
      const config: LLMModelConfig = {
        model: "gpt-4",
        apiKey: undefined,
      };

      expect(() => LangchainModels.gpt(config)).toThrow(
        "OpenAI API key is not passed in the model parameters"
      );
    });
  });

  describe("gemini", () => {
    it("deve criar uma instância do ChatGoogleGenerativeAI com configurações básicas", () => {
      const config: LLMModelConfig = {
        model: "gemini-2.5-flash",
        apiKey: "test-api-key",
      };

      LangchainModels.gemini(config);

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

      LangchainModels.gemini(config);

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

      LangchainModels.gemini(config);

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

      LangchainModels.gemini(config);

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

      expect(() => LangchainModels.gemini(config)).toThrow(
        "Google Gemini API key is not passed in the model parameters"
      );
    });

    it("deve lançar erro quando apiKey é undefined", () => {
      const config: LLMModelConfig = {
        model: "gemini-2.5-flash",
        apiKey: undefined,
      };

      expect(() => LangchainModels.gemini(config)).toThrow(
        "Google Gemini API key is not passed in the model parameters"
      );
    });
  });
});
