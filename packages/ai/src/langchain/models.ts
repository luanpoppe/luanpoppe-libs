import {
  ChatGoogleGenerativeAI,
  GoogleGenerativeAIChatInput,
} from "@langchain/google-genai";
import { ChatOpenAI, ChatOpenAIFields } from "@langchain/openai";

export type LLMModelConfig = {
  model: string;
  apiKey?: string | undefined;
  maxTokens?: number | undefined;
  temperature?: number | undefined;
};

export class LangchainModels {
  static gpt(params: LLMModelConfig) {
    const { model, apiKey, maxTokens, temperature } = params;
    if (!apiKey)
      throw new Error("OpenAI API key is not passed in the model parameters");

    const options: ChatOpenAIFields = {
      model,
      apiKey,
    };

    if (maxTokens) options.maxTokens = maxTokens;
    if (temperature) options.temperature = temperature;

    return new ChatOpenAI(options);
  }

  static gemini(params: LLMModelConfig) {
    const { apiKey, maxTokens, model, temperature } = params;

    if (!apiKey)
      throw new Error(
        "Google Gemini API key is not passed in the model parameters"
      );

    const options: GoogleGenerativeAIChatInput = {
      model,
      apiKey,
    };

    if (maxTokens) options.maxOutputTokens = maxTokens;
    if (temperature) options.temperature = temperature;

    return new ChatGoogleGenerativeAI(options);
  }

  static openrouter(params: LLMModelConfig & { httpReferer?: string; title?: string }) {
    const { apiKey, maxTokens, model, temperature, httpReferer, title } = params;

    if (!apiKey)
      throw new Error(
        "OpenRouter API key is not passed in the model parameters"
      );

    const options: ChatOpenAIFields = {
      model,
      apiKey,
      configuration: {
        baseURL: "https://openrouter.ai/api/v1",
      },
    };

    if (maxTokens) options.maxTokens = maxTokens;
    if (temperature) options.temperature = temperature;

    return new ChatOpenAI(options);
  }
}
