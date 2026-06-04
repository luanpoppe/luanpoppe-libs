import { AI } from "../../src/index";
import { AIMessages } from "../../src/langchain/messages";
import "dotenv/config";

const ollamaBaseUrl = process.env.OLLAMA_BASE_URL ?? "http://127.0.0.1:11434";
const ollamaModel = process.env.OLLAMA_MODEL_NAME ?? "llama3.2";
const localBaseUrl = process.env.LOCAL_BASE_URL;
const localModel = process.env.LOCAL_MODEL_NAME ?? "local-model";

const timeout = 180 * 1000;

describe("AI E2E — modelos locais", () => {
  describe.skipIf(!process.env.OLLAMA_E2E)(
    "Ollama (API nativa, prefixo ollama/)",
    () => {
      it(
        "deve responder via ChatOllama",
        { timeout },
        async () => {
          const ai = new AI({ ollamaBaseUrl });

          const result = await ai.call({
            aiModel: `ollama/${ollamaModel}`,
            messages: [
              AIMessages.human(
                "Responda apenas com: teste ollama ok",
              ),
            ],
          });

          expect(result.text).toBeDefined();
          expect(result.text.length).toBeGreaterThan(0);
        },
      );
    },
  );

  describe.skipIf(!localBaseUrl)(
    "OpenAI-compatible (prefixo local/)",
    () => {
      it(
        "deve responder via servidor local (LM Studio, Ollama /v1, etc.)",
        { timeout },
        async () => {
          const ai = new AI({
            localBaseUrl,
            localApiKey: process.env.LOCAL_API_KEY,
          });

          const result = await ai.call({
            aiModel: `local/${localModel}`,
            messages: [
              AIMessages.human(
                "Responda apenas com: teste local ok",
              ),
            ],
          });

          expect(result.text).toBeDefined();
          expect(result.text.length).toBeGreaterThan(0);
        },
      );
    },
  );
});
