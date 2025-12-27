import {
  ChatGoogleGenerativeAI,
  GoogleGenerativeAIChatInput,
} from "@langchain/google-genai";
import { ChatOpenAI, ChatOpenAIFields } from "@langchain/openai";
import { env } from "../core/env";

export class LangchainModels {
  static gpt(params: ChatOpenAIFields) {
    console.log({ env });
    return new ChatOpenAI({
      temperature: 0,
      maxTokens: 2048,
      apiKey: env.OPENAI_API_KEY,
      ...params,
    });
  }

  static gemini(params: GoogleGenerativeAIChatInput) {
    return new ChatGoogleGenerativeAI({
      maxOutputTokens: 2048,
      apiKey: env.GOOGLE_GENAI_API_KEY,
      ...params,
    });
  }
}
