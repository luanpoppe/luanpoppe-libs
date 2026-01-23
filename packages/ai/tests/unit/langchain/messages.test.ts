import { LangchainMessages } from "../../../src/langchain/messages";
import { SystemMessage, HumanMessage, AIMessage } from "langchain";

// Mock do langchain
vi.mock("langchain", () => {
  class MockSystemMessage {
    constructor(public content: string) { }
  }
  class MockHumanMessage {
    constructor(public content: string) { }
  }
  class MockAIMessage {
    constructor(public content: string) { }
  }
  function SystemMessageConstructor(content: string) {
    return new MockSystemMessage(content);
  }
  function HumanMessageConstructor(content: string) {
    return new MockHumanMessage(content);
  }
  function AIMessageConstructor(content: string) {
    return new MockAIMessage(content);
  }
  return {
    SystemMessage: vi.fn(SystemMessageConstructor),
    HumanMessage: vi.fn(HumanMessageConstructor),
    AIMessage: vi.fn(AIMessageConstructor),
  };
});

describe("LangchainMessages", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("system", () => {
    it("deve criar uma SystemMessage com a mensagem fornecida", () => {
      const message = "Esta é uma mensagem do sistema";

      const result = LangchainMessages.system(message);

      expect(result).toBeDefined();
      expect(result.content).toBe(message);
      expect(SystemMessage).toHaveBeenCalledWith(message);
    });

    it("deve criar uma SystemMessage com string vazia", () => {
      const message = "";

      const result = LangchainMessages.system(message);

      expect(result).toBeDefined();
      expect(result.content).toBe("");
      expect(SystemMessage).toHaveBeenCalledWith("");
    });
  });

  describe("human", () => {
    it("deve criar uma HumanMessage com a mensagem fornecida", () => {
      const message = "Esta é uma mensagem do usuário";

      const result = LangchainMessages.human(message);

      expect(result).toBeDefined();
      expect(result.content).toBe(message);
      expect(HumanMessage).toHaveBeenCalledWith(message);
    });

    it("deve criar uma HumanMessage com string vazia", () => {
      const message = "";

      const result = LangchainMessages.human(message);

      expect(result).toBeDefined();
      expect(result.content).toBe("");
      expect(HumanMessage).toHaveBeenCalledWith("");
    });
  });

  describe("ai", () => {
    it("deve criar uma AIMessage com a mensagem fornecida", () => {
      const message = "Esta é uma mensagem da IA";

      const result = LangchainMessages.ai(message);

      expect(result).toBeDefined();
      expect(result.content).toBe(message);
      expect(AIMessage).toHaveBeenCalledWith(message);
    });

    it("deve criar uma AIMessage com string vazia", () => {
      const message = "";

      const result = LangchainMessages.ai(message);

      expect(result).toBeDefined();
      expect(result.content).toBe("");
      expect(AIMessage).toHaveBeenCalledWith("");
    });
  });
});
