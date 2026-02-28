import * as fs from "fs";
import * as path from "path";
import { AI } from "../../src/index";
import { AIMessages } from "../../src/langchain/messages";
import "dotenv/config";

const IMAGE_FIXTURE_PATH = path.join(
  process.cwd(),
  "tests",
  "e2e",
  "@fixtures",
  "imagem-teste-bateria.jpg"
);

const PROMPT =
  "Descreva brevemente o que há nesta imagem. Responda em uma frase.";

const EXPECTED_TERMS = [
  "bateria",
  "baterista",
  "pratos",
  "tambor",
  "drum",
  "cymbal",
  "palco",
  "stage",
];

function responseRelatesToImage(text: string): boolean {
  const lower = text.toLowerCase();
  return EXPECTED_TERMS.some((term) => lower.includes(term));
}

describe("AI Image E2E Tests", () => {
  const openAIApiKey = process.env.OPENAI_API_KEY;
  const googleGeminiToken = process.env.GOOGLE_GEMINI_TOKEN;
  const openRouterApiKey = process.env.OPENROUTER_API_KEY;

  const timeout = 180 * 1000;

  describe("Suporte a imagens", () => {
    it(
      "deve processar imagem com OpenAI (gpt-4o)",
      { timeout },
      async () => {
        if (!openAIApiKey) {
          console.log("OPENAI_API_KEY não está configurada");
          return;
        }
        const ai = new AI({
          openAIApiKey: openAIApiKey!,
        });

        const imageBuffer = fs.readFileSync(IMAGE_FIXTURE_PATH);
        const message = AIMessages.humanImage({
          image: {
            buffer: imageBuffer,
            filename: "imagem-teste-bateria.jpg",
          },
          text: PROMPT,
        });

        const result = await ai.call({
          aiModel: "gpt-4o",
          messages: [message],
        });

        expect(result.text).toBeDefined();
        expect(result.text.length).toBeGreaterThan(0);
        expect(result.text).not.toContain("Model call failed");
        expect(result.text).not.toContain("Invalid");
        expect(responseRelatesToImage(result.text)).toBe(true);
      }
    );

    it.skip(
      "deve processar imagem com Gemini (gemini-2.5-flash)",
      { timeout },
      async () => {
        if (!googleGeminiToken) {
          console.log("GOOGLE_GEMINI_TOKEN não está configurada");
          return;
        }
        const ai = new AI({
          googleGeminiToken: googleGeminiToken!,
        });

        const imageBuffer = fs.readFileSync(IMAGE_FIXTURE_PATH);
        const message = AIMessages.humanImage({
          image: {
            buffer: imageBuffer,
            filename: "imagem-teste-bateria.jpg",
          },
          text: PROMPT,
        });

        const result = await ai.call({
          aiModel: "gemini-2.5-flash",
          messages: [message],
        });

        expect(result.text).toBeDefined();
        expect(result.text.length).toBeGreaterThan(0);
        expect(responseRelatesToImage(result.text)).toBe(true);
      }
    );

    it.skip(
      "deve processar imagem com OpenRouter (openrouter/openai/gpt-4o)",
      { timeout },
      async () => {
        if (!openRouterApiKey) {
          console.log("OPENROUTER_API_KEY não está configurada");
          return;
        }
        const ai = new AI({
          openRouterApiKey: openRouterApiKey!,
        });

        const imageBuffer = fs.readFileSync(IMAGE_FIXTURE_PATH);
        const message = AIMessages.humanImage({
          image: {
            buffer: imageBuffer,
            filename: "imagem-teste-bateria.jpg",
          },
          text: PROMPT,
        });

        const result = await ai.call({
          aiModel: "openrouter/openai/gpt-4o",
          messages: [message],
        });

        expect(result.text).toBeDefined();
        expect(result.text.length).toBeGreaterThan(0);
        expect(result.text).not.toContain("Model call failed");
        expect(responseRelatesToImage(result.text)).toBe(true);
      }
    );

    it.skip(
      "deve processar imagem com OpenRouter (openrouter/google/gemini-2.5-flash)",
      { timeout },
      async () => {
        if (!openRouterApiKey) {
          console.log("OPENROUTER_API_KEY não está configurada");
          return;
        }
        const ai = new AI({
          openRouterApiKey: openRouterApiKey!,
        });

        const imageBuffer = fs.readFileSync(IMAGE_FIXTURE_PATH);
        const message = AIMessages.humanImage({
          image: {
            buffer: imageBuffer,
            filename: "imagem-teste-bateria.jpg",
          },
          text: PROMPT,
        });

        const result = await ai.call({
          aiModel: "openrouter/google/gemini-2.5-flash",
          messages: [message],
        });

        expect(result.text).toBeDefined();
        expect(result.text.length).toBeGreaterThan(0);
        expect(responseRelatesToImage(result.text)).toBe(true);
      }
    );
  });
});
