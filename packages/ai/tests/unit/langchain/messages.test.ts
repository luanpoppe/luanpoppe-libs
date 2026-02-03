import { AIMessages } from "../../../src/langchain/messages";
import { SystemMessage, HumanMessage, AIMessage } from "langchain";

// Mock do langchain
vi.mock("langchain", () => {
  class MockSystemMessage {
    constructor(public content: string) {}
  }
  class MockHumanMessage {
    constructor(public content: string | Array<any>) {}
  }
  class MockAIMessage {
    constructor(public content: string) {}
  }
  function SystemMessageConstructor(content: string) {
    return new MockSystemMessage(content);
  }
  function HumanMessageConstructor(content: string | Array<any>) {
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

describe("AIMessages", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("system", () => {
    it("deve criar uma SystemMessage com a mensagem fornecida", () => {
      const message = "Esta é uma mensagem do sistema";

      const result = AIMessages.system(message);

      expect(result).toBeDefined();
      expect(result.content).toBe(message);
      expect(SystemMessage).toHaveBeenCalledWith(message);
    });

    it("deve criar uma SystemMessage com string vazia", () => {
      const message = "";

      const result = AIMessages.system(message);

      expect(result).toBeDefined();
      expect(result.content).toBe("");
      expect(SystemMessage).toHaveBeenCalledWith("");
    });
  });

  describe("human", () => {
    it("deve criar uma HumanMessage com a mensagem fornecida", () => {
      const message = "Esta é uma mensagem do usuário";

      const result = AIMessages.human(message);

      expect(result).toBeDefined();
      expect(result.content).toBe(message);
      expect(HumanMessage).toHaveBeenCalledWith(message);
    });

    it("deve criar uma HumanMessage com string vazia", () => {
      const message = "";

      const result = AIMessages.human(message);

      expect(result).toBeDefined();
      expect(result.content).toBe("");
      expect(HumanMessage).toHaveBeenCalledWith("");
    });
  });

  describe("ai", () => {
    it("deve criar uma AIMessage com a mensagem fornecida", () => {
      const message = "Esta é uma mensagem da IA";

      const result = AIMessages.ai(message);

      expect(result).toBeDefined();
      expect(result.content).toBe(message);
      expect(AIMessage).toHaveBeenCalledWith(message);
    });

    it("deve criar uma AIMessage com string vazia", () => {
      const message = "";

      const result = AIMessages.ai(message);

      expect(result).toBeDefined();
      expect(result.content).toBe("");
      expect(AIMessage).toHaveBeenCalledWith("");
    });
  });

  describe("humanAudio", () => {
    it("deve criar uma HumanMessage com conteúdo de áudio", async () => {
      const audioBuffer = Buffer.from("fake audio data");
      const text = "Transcreva este áudio";

      const result = await AIMessages.humanAudio({
        audio: {
          buffer: audioBuffer,
          mimeType: "audio/mp3",
          filename: "audio.mp3",
        },
        text,
      });

      expect(result).toBeDefined();
      expect(HumanMessage).toHaveBeenCalled();
      const callArgs = (HumanMessage as any).mock.calls[0][0];
      expect(callArgs.content).toBeInstanceOf(Array);
      expect(callArgs.content.length).toBe(2);
      // Texto agora é um objeto quando há áudio multimodal
      expect(callArgs.content[0].type).toBe("text");
      expect(callArgs.content[0].text).toBe(text);
      expect(callArgs.content[1].type).toBe("audio");
      expect(callArgs.content[1].source_type).toBe("base64");
      expect(callArgs.content[1].mime_type).toBe("audio/mp3");
      expect(callArgs.content[1].data).toBeDefined();
    });

    it("deve criar uma HumanMessage apenas com áudio (sem texto)", async () => {
      const audioBuffer = Buffer.from("fake audio data");

      const result = await AIMessages.humanAudio({
        audio: {
          buffer: audioBuffer,
        },
      });

      expect(result).toBeDefined();
      expect(HumanMessage).toHaveBeenCalled();
      const callArgs = (HumanMessage as any).mock.calls[0][0];
      expect(callArgs.content).toBeInstanceOf(Array);
      expect(callArgs.content.length).toBe(1);
      expect(callArgs.content[0].type).toBe("audio");
    });

    it("deve detectar MIME type automaticamente pela extensão", async () => {
      const audioBuffer = Buffer.from("fake audio data");

      const result = await AIMessages.humanAudio({
        audio: {
          buffer: audioBuffer,
          filename: "audio.wav",
        },
      });

      expect(result).toBeDefined();
      const callArgs = (HumanMessage as any).mock.calls[0][0];
      expect(callArgs.content[0].mime_type).toBe("audio/wav");
    });

    it("deve usar MIME type fornecido mesmo com extensão", async () => {
      const audioBuffer = Buffer.from("fake audio data");

      const result = await AIMessages.humanAudio({
        audio: {
          buffer: audioBuffer,
          mimeType: "audio/mp4",
          filename: "audio.wav",
        },
      });

      expect(result).toBeDefined();
      const callArgs = (HumanMessage as any).mock.calls[0][0];
      expect(callArgs.content[0].mime_type).toBe("audio/mp4");
    });
  });
});
