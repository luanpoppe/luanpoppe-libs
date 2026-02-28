import {
  ChatGoogleGenerativeAI,
  GoogleGenerativeAIChatInput,
} from "@langchain/google-genai";
import { ChatOpenAI, ChatOpenAIFields } from "@langchain/openai";

/** Nível de esforço de raciocínio para modelos OpenAI (o1, gpt-5, etc.). Valores: "low" | "medium" | "high" */
export type ReasoningEffort = "low" | "medium" | "high";

export type LLMModelConfig = {
  model: string;
  apiKey?: string | undefined;
  maxTokens?: number | undefined;
  temperature?: number | undefined;
  /** Nível de esforço de raciocínio (modelos OpenAI: o1, gpt-5, etc.) */
  reasoningEffort?: ReasoningEffort | undefined;
};

export class AIModels {
  static gpt(params: LLMModelConfig) {
    const { model, apiKey, maxTokens, temperature, reasoningEffort } = params;
    if (!apiKey)
      throw new Error("OpenAI API key is not passed in the model parameters");

    const options: ChatOpenAIFields = {
      model,
      apiKey,
    };

    if (maxTokens) options.maxTokens = maxTokens;
    if (temperature) options.temperature = temperature;
    if (reasoningEffort) {
      options.modelKwargs = {
        ...(options.modelKwargs ?? {}),
        reasoning_effort: reasoningEffort,
      };
    }

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

  static openrouter(params: LLMModelConfig) {
    const { apiKey, maxTokens, model, temperature, reasoningEffort } = params;

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
    if (reasoningEffort) {
      options.modelKwargs = {
        ...(options.modelKwargs ?? {}),
        reasoning_effort: reasoningEffort,
      };
    }

    return new ChatOpenAI(options);
  }
}
