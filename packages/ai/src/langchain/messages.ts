import { SystemMessage, HumanMessage, AIMessage } from "langchain";

export type MessageInput = SystemMessage | HumanMessage | AIMessage;

export class LangchainMessages {
  static system(message: string): SystemMessage {
    return new SystemMessage(message);
  }
  static human(message: string): HumanMessage {
    return new HumanMessage(message);
  }
  static ai(message: string): AIMessage {
    return new AIMessage(message);
  }
}
