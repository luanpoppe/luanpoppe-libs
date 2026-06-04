import {
  ChatGoogleGenerativeAI,
  GoogleGenerativeAIChatInput,
} from "@langchain/google-genai";
import { ChatOllama, type ChatOllamaInput } from "@langchain/ollama";
import { ChatOpenAI, ChatOpenAIFields } from "@langchain/openai";
import type { OpenRouterProviderPreferences } from "../@types/openrouter-provider";

export const DEFAULT_OLLAMA_BASE_URL = "http://127.0.0.1:11434";

export const DEFAULT_LOCAL_API_KEY = "not-needed";

export type {
  OpenRouterMaxPrice,
  OpenRouterProviderPreferences,
  OpenRouterProviderSort,
} from "../@types/openrouter-provider";

/** Nível de esforço de raciocínio para modelos OpenAI (o1, gpt-5, etc.). Valores: "low" | "medium" | "high" */
export type ReasoningEffort = "low" | "medium" | "high";

export type OllamaModelConfig = {
  model: string;
  baseUrl?: string | undefined;
  maxTokens?: number | undefined;
  temperature?: number | undefined;
  numCtx?: number | undefined;
};

export type OpenAICompatibleModelConfig = {
  model: string;
  baseURL: string;
  apiKey?: string | undefined;
  maxTokens?: number | undefined;
  temperature?: number | undefined;
};

export type LLMModelConfig = {
  model: string;
  apiKey?: string | undefined;
  /** Override da URL do servidor (Ollama nativo ou OpenAI-compatible local) */
  baseUrl?: string | undefined;
  maxTokens?: number | undefined;
  temperature?: number | undefined;
  /** Tamanho do contexto (Ollama nativo, `num_ctx`) */
  numCtx?: number | undefined;
  /** Nível de esforço de raciocínio (modelos OpenAI: o1, gpt-5, etc.) */
  reasoningEffort?: ReasoningEffort | undefined;
  /** Preferências de roteamento de providers do OpenRouter */
  openRouterProvider?: OpenRouterProviderPreferences | undefined;
  /**
   * Se true, não aplica `only: ["deepseek"]` em modelos `deepseek/*` via OpenRouter.
   * Use para aceitar o roteamento padrão do OpenRouter (todos os providers).
   */
  openRouterAllowAllProviders?: boolean | undefined;
  /**
   * Força `response_format: { type: "json_object" }` no OpenRouter (ex.: DeepSeek).
   * Uso interno via `callStructuredOutput`.
   */
  openRouterForceJsonObject?: boolean | undefined;
};

const DEEPSEEK_OPENROUTER_PROVIDER: OpenRouterProviderPreferences = {
  only: ["deepseek"],
};

export function resolveOpenRouterProvider(
  model: string,
  config: Pick<
    LLMModelConfig,
    "openRouterProvider" | "openRouterAllowAllProviders"
  >,
): OpenRouterProviderPreferences | undefined {
  if (config.openRouterProvider !== undefined) {
    return config.openRouterProvider;
  }

  if (config.openRouterAllowAllProviders === true) {
    return undefined;
  }

  if (model.startsWith("deepseek/")) {
    return DEEPSEEK_OPENROUTER_PROVIDER;
  }

  return undefined;
}

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
    const {
      apiKey,
      maxTokens,
      model,
      temperature,
      reasoningEffort,
      openRouterProvider,
      openRouterAllowAllProviders,
      openRouterForceJsonObject,
    } = params;

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

    const provider = resolveOpenRouterProvider(model, {
      openRouterProvider,
      openRouterAllowAllProviders,
    });

    if (reasoningEffort || provider || openRouterForceJsonObject) {
      options.modelKwargs = {
        ...(options.modelKwargs ?? {}),
        ...(reasoningEffort ? { reasoning_effort: reasoningEffort } : {}),
        ...(provider ? { provider } : {}),
        ...(openRouterForceJsonObject
          ? { response_format: { type: "json_object" } }
          : {}),
      };
    }

    return new ChatOpenAI(options);
  }

  static ollama(params: OllamaModelConfig) {
    const { model, baseUrl, maxTokens, temperature, numCtx } = params;

    const options: ChatOllamaInput = {
      model,
      baseUrl: baseUrl ?? DEFAULT_OLLAMA_BASE_URL,
    };

    if (temperature !== undefined) options.temperature = temperature;
    if (numCtx !== undefined) options.numCtx = numCtx;
    if (maxTokens !== undefined) options.numPredict = maxTokens;

    return new ChatOllama(options);
  }

  static openaiCompatible(params: OpenAICompatibleModelConfig) {
    const { model, baseURL, apiKey, maxTokens, temperature } = params;

    if (!baseURL) {
      throw new Error(
        "baseURL é obrigatório para servidores OpenAI-compatible (LM Studio, Ollama /v1, vLLM, etc.).",
      );
    }

    const options: ChatOpenAIFields = {
      model,
      apiKey: apiKey ?? DEFAULT_LOCAL_API_KEY,
      configuration: {
        baseURL,
      },
    };

    if (maxTokens) options.maxTokens = maxTokens;
    if (temperature !== undefined) options.temperature = temperature;

    return new ChatOpenAI(options);
  }
}
