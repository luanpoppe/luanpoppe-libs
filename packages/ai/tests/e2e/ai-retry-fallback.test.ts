import { AI } from "../../src/index";
import { AIMessages } from "../../src/langchain/messages";
import z from "zod";
import "dotenv/config";

/**
 * Flag controlada por cada teste. Quando true, a PRÓXIMA chamada a createAgent
 * retornará um agente mock que falha no invoke. As chamadas seguintes usam o real.
 */
let simulateNextCreateAgentFailure = false;

/**
 * Quantidade de chamadas a createAgent que devem falhar. Quando > 0, retorna mock que falha.
 * Usado no teste "todos os modelos falharem" para evitar chamadas reais (timeout).
 */
let simulateFailureCount = 0;

vi.mock("langchain", async (importOriginal) => {
  const actual = await importOriginal<typeof import("langchain")>();
  return {
    ...actual,
    createAgent: vi.fn((config: any) => {
      if (simulateFailureCount > 0) {
        simulateFailureCount--;
        return {
          invoke: vi.fn().mockRejectedValue(new Error("Simulated failure")),
        } as any;
      }
      if (simulateNextCreateAgentFailure) {
        simulateNextCreateAgentFailure = false;
        return {
          invoke: vi.fn().mockRejectedValue(new Error("Simulated failure")),
        } as any;
      }
      return actual.createAgent(config);
    }),
  };
});

describe("AI E2E - Retry e Fallback (mock seletivo + real)", () => {
  const openAIApiKey = process.env.OPENAI_API_KEY;
  const openRouterApiKey = process.env.OPENROUTER_API_KEY;
  const timeout = 180 * 1000;

  beforeEach(() => {
    simulateNextCreateAgentFailure = false;
    simulateFailureCount = 0;
  });

  it(
    "deve fazer fallback quando primeiro modelo falhar (mock) e segundo usar real GPT",
    { timeout },
    async () => {
      if (!openAIApiKey) {
        console.log("OPENAI_API_KEY não está configurada");
        return;
      }
      simulateNextCreateAgentFailure = true;

      const ai = new AI({ openAIApiKey: openAIApiKey });

      const result = await ai.call({
        aiModel: "gpt-5-nano",
        messages: [AIMessages.human("Responda apenas com 'Fallback mock+real ok'")],
        aiModelsFallback: ["gpt-5-nano"],
      });

      expect(result.text).toBeDefined();
      expect(result.text.length).toBeGreaterThan(0);
      expect(result.text.toLowerCase()).toContain("fallback");
    },
  );

  it(
    "deve fazer fallback quando primeiro modelo falhar (mock) e segundo usar real OpenRouter",
    { timeout },
    async () => {
      if (!openRouterApiKey) {
        console.log("OPENROUTER_API_KEY não está configurada");
        return;
      }
      simulateNextCreateAgentFailure = true;

      const ai = new AI({ openRouterApiKey: openRouterApiKey! });

      const result = await ai.call({
        aiModel: "openrouter/openai/gpt-5-nano",
        messages: [AIMessages.human("Responda apenas com 'Fallback OpenRouter ok'")],
        aiModelsFallback: ["openrouter/openai/gpt-5-nano"],
      });

      expect(result.text).toBeDefined();
      expect(result.text.length).toBeGreaterThan(0);
      expect(result.text.toLowerCase()).toContain("fallback");
    },
  );

  it(
    "deve fazer fallback entre provedores: GPT (mock fail) -> OpenRouter (real)",
    { timeout },
    async () => {
      if (!openAIApiKey || !openRouterApiKey) {
        console.log("OPENAI_API_KEY e OPENROUTER_API_KEY são necessárias");
        return;
      }
      simulateNextCreateAgentFailure = true;

      const ai = new AI({
        openAIApiKey: openAIApiKey!,
        openRouterApiKey: openRouterApiKey!,
      });

      const result = await ai.call({
        aiModel: "gpt-5-nano",
        messages: [AIMessages.human("Responda apenas com 'Fallback cross-provider ok'")],
        aiModelsFallback: ["openrouter/openai/gpt-5-nano"],
      });

      expect(result.text).toBeDefined();
      expect(result.text.length).toBeGreaterThan(0);
      expect(result.text.toLowerCase()).toContain("fallback");
    },
  );

  it(
    "deve fazer fallback no callStructuredOutput: primeiro modelo falha (mock), segundo real",
    { timeout },
    async () => {
      if (!openAIApiKey) {
        console.log("OPENAI_API_KEY não está configurada");
        return;
      }
      simulateNextCreateAgentFailure = true;

      const ai = new AI({ openAIApiKey: openAIApiKey! });

      const outputSchema = z.object({ answer: z.string() });

      const result = await ai.callStructuredOutput({
        aiModel: "gpt-5-nano",
        messages: [
          AIMessages.human('Responda com JSON: { "answer": "fallback structured ok" }'),
        ],
        outputSchema,
        aiModelsFallback: ["gpt-5-nano"],
      });

      expect(result.response).toBeDefined();
      expect(result.response.answer.toLowerCase()).toContain("fallback");
    },
  );

  it(
    "deve fazer fallback para o mesmo modelo quando primeira tentativa falhar (mock) e segunda usar real",
    { timeout },
    async () => {
      if (!openAIApiKey) {
        console.log("OPENAI_API_KEY não está configurada");
        return;
      }
      simulateNextCreateAgentFailure = true;

      const ai = new AI({ openAIApiKey: openAIApiKey! });

      const result = await ai.call({
        aiModel: "gpt-5-nano",
        messages: [AIMessages.human("Diga: retry ok")],
        maxRetries: 2,
        aiModelsFallback: ["gpt-5-nano"],
      });

      expect(result.text).toBeDefined();
      expect(result.text.length).toBeGreaterThan(0);
    },
  );

  it(
    "deve respeitar maxRetries e completar chamada com sucesso",
    { timeout },
    async () => {
      if (!openAIApiKey) {
        console.log("OPENAI_API_KEY não está configurada");
        return;
      }
      const ai = new AI({ openAIApiKey: openAIApiKey! });

      const result = await ai.call({
        aiModel: "gpt-5-nano",
        messages: [AIMessages.human("Diga apenas: retry config ok")],
        maxRetries: 2,
      });

      expect(result.text).toBeDefined();
      expect(result.text.length).toBeGreaterThan(0);
    },
  );

  it("deve lançar exceção quando todos os modelos falharem", async () => {
    simulateFailureCount = 2;

    const ai = new AI({
      openAIApiKey: "test-key",
    });

    await expect(
      ai.call({
        aiModel: "gpt-4",
        messages: [AIMessages.human("teste")],
        aiModelsFallback: ["gpt-5-nano"],
      }),
    ).rejects.toThrow("Simulated failure");
  });
});
