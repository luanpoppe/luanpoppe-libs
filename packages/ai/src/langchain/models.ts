import {
  ChatGoogleGenerativeAI,
  GoogleGenerativeAIChatInput,
} from "@langchain/google-genai";
import { ChatOpenAI, ChatOpenAIFields } from "@langchain/openai";

export class LangchainModels {
  static gpt(params: ChatOpenAIFields) {
    if (!params.apiKey)
      throw new Error("OpenAI API key is not passed in the model parameters");

    return new ChatOpenAI({
      maxTokens: 2048,
      ...params,
    });
  }

  static gemini(params: GoogleGenerativeAIChatInput) {
    if (!params.apiKey)
      throw new Error(
        "Google Gemini API key is not passed in the model parameters"
      );

    return new ChatGoogleGenerativeAI({
      maxOutputTokens: 2048,
      ...params,
    });
  }
}
