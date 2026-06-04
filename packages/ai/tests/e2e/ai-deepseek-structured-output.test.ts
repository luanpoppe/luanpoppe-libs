import { AI } from "../../src/index";
import { AIMessages } from "../../src/langchain/messages";
import z from "zod";
import "dotenv/config";

describe("AI E2E - DeepSeek Structured Output", () => {
  const openRouterApiKey = process.env.OPENROUTER_API_KEY;
  const timeout = 180 * 1000;

  const requireOpenRouter = () => {
    if (!openRouterApiKey) {
      console.log("OPENROUTER_API_KEY não está configurada");
      return false;
    }
    return true;
  };

  it(
    "deve retornar schema numérico com deepseek-v4-flash",
    { timeout },
    async () => {
      if (!requireOpenRouter()) return;

      const ai = new AI({ openRouterApiKey: openRouterApiKey! });
      const outputSchema = z.object({
        sum: z.number(),
        product: z.number(),
      });

      const result = await ai.callStructuredOutput({
        aiModel: "openrouter/deepseek/deepseek-v4-flash",
        messages: [
          AIMessages.human(
            "Calcule a soma e o produto de 7 e 4. Responda em json.",
          ),
        ],
        outputSchema,
      });

      expect(result.response.sum).toBe(11);
      expect(result.response.product).toBe(28);
    },
  );

  it(
    "deve extrair nome e idade com deepseek-v4-pro",
    { timeout },
    async () => {
      if (!requireOpenRouter()) return;

      const ai = new AI({ openRouterApiKey: openRouterApiKey! });
      const outputSchema = z.object({
        nome: z.string(),
        idade: z.number(),
      });

      const result = await ai.callStructuredOutput({
        aiModel: "openrouter/deepseek/deepseek-v4-pro",
        messages: [
          AIMessages.human(
            "Extraia nome e idade do texto: João tem 30 anos. Responda em json.",
          ),
        ],
        outputSchema,
      });

      expect(result.response.nome.toLowerCase()).toContain("joão");
      expect(result.response.idade).toBe(30);
    },
  );

  it(
    "deve suportar campos opcional/nullable com deepseek-v4-flash",
    { timeout },
    async () => {
      if (!requireOpenRouter()) return;

      const ai = new AI({ openRouterApiKey: openRouterApiKey! });
      const outputSchema = z.object({
        prontuarioFormal: z
          .string()
          .describe("Texto do prontuário")
          .nullable(),
        dataConsulta: z
          .string()
          .optional()
          .describe("Data DD/MM/AAAA"),
      });

      const result = await ai.callStructuredOutput({
        aiModel: "openrouter/deepseek/deepseek-v4-flash",
        messages: [
          AIMessages.human(
            "Crie um prontuário breve para João, 30 anos, consulta 25/01/2026. Responda em json.",
          ),
        ],
        outputSchema,
      });

      expect(result.response.prontuarioFormal).toBeDefined();
      expect(typeof result.response.prontuarioFormal).toBe("string");
      if (result.response.dataConsulta) {
        expect(typeof result.response.dataConsulta).toBe("string");
      }
    },
  );

  it(
    "deve suportar aiModelsFallback deepseek -> openai",
    { timeout },
    async () => {
      if (!requireOpenRouter()) return;

      const ai = new AI({ openRouterApiKey: openRouterApiKey! });
      const outputSchema = z.object({
        answer: z.string(),
      });

      const result = await ai.callStructuredOutput({
        aiModel: "openrouter/deepseek/deepseek-v4-flash",
        messages: [
          AIMessages.human(
            'Responda em json: { "answer": "fallback deepseek ok" }',
          ),
        ],
        outputSchema,
        aiModelsFallback: ["openrouter/openai/gpt-5-nano"],
      });

      expect(result.response.answer.toLowerCase()).toContain("fallback");
    },
  );
});
