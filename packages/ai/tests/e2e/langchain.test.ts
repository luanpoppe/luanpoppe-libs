import { Langchain } from "../../src/index";
import { LangchainMessages } from "../../src/langchain/messages";
import z from "zod";

describe("Langchain E2E Tests", () => {
  const openAIApiKey = process.env.OPENAI_API_KEY;
  const googleGeminiToken = process.env.GOOGLE_GEMINI_TOKEN;

  // Pular testes se as API keys não estiverem configuradas
  const shouldRunOpenAITests = !!openAIApiKey;
  const shouldRunGeminiTests = !!googleGeminiToken;

  describe("Chamadas básicas", () => {
    it.skipIf(!shouldRunOpenAITests)(
      "deve fazer uma chamada real para GPT-4o e retornar resposta",
      { timeout: 30000 },
      async () => {
        const langchain = new Langchain({
          openAIApiKey: openAIApiKey!,
        });

        const messages = [
          LangchainMessages.human("Olá! Responda apenas com 'Teste E2E GPT funcionando'"),
        ];

        const result = await langchain.call({
          aiModel: "gpt-4o",
          messages,
        });

        expect(result.text).toBeDefined();
        expect(result.text.length).toBeGreaterThan(0);
        expect(result.messages).toBeDefined();
        expect(result.messages.length).toBeGreaterThan(0);
        expect(result.text.toLowerCase()).toContain("teste");
      }
    );

    it.skipIf(!shouldRunGeminiTests)(
      "deve fazer uma chamada real para Gemini e retornar resposta",
      { timeout: 30000 },
      async () => {
        const langchain = new Langchain({
          googleGeminiToken: googleGeminiToken!,
        });

        const messages = [
          LangchainMessages.human("Olá! Responda apenas com 'Teste E2E Gemini funcionando'"),
        ];

        const result = await langchain.call({
          aiModel: "gemini-2.5-flash",
          messages,
        });

        expect(result.text).toBeDefined();
        expect(result.text.length).toBeGreaterThan(0);
        expect(result.messages).toBeDefined();
        expect(result.messages.length).toBeGreaterThan(0);
        expect(result.text.toLowerCase()).toContain("teste");
      }
    );
  });

  describe("Criação de mensagens", () => {
    it.skipIf(!shouldRunOpenAITests)(
      "deve criar mensagens corretamente e fazer chamada",
      { timeout: 30000 },
      async () => {
        const langchain = new Langchain({
          openAIApiKey: openAIApiKey!,
        });

        const systemMessage = LangchainMessages.system(
          "Você é um assistente útil que responde de forma concisa."
        );
        const humanMessage = LangchainMessages.human("Qual é a capital do Brasil?");

        const messages = [systemMessage, humanMessage];

        const result = await langchain.call({
          aiModel: "gpt-4o",
          messages,
        });

        expect(result.text).toBeDefined();
        expect(result.text.length).toBeGreaterThan(0);
        expect(result.text.toLowerCase()).toContain("brasília");
      }
    );

    it.skipIf(!shouldRunGeminiTests)(
      "deve criar múltiplas mensagens e fazer chamada",
      { timeout: 30000 },
      async () => {
        const langchain = new Langchain({
          googleGeminiToken: googleGeminiToken!,
        });

        const messages = [
          LangchainMessages.system("Você é um assistente matemático."),
          LangchainMessages.human("Quanto é 2 + 2?"),
        ];

        const result = await langchain.call({
          aiModel: "gemini-2.5-flash",
          messages,
        });

        expect(result.text).toBeDefined();
        expect(result.text.length).toBeGreaterThan(0);
        expect(result.text).toMatch(/\b4\b/);
      }
    );
  });

  describe("System Prompt", () => {
    it.skipIf(!shouldRunOpenAITests)(
      "deve usar systemPrompt corretamente",
      { timeout: 30000 },
      async () => {
        const langchain = new Langchain({
          openAIApiKey: openAIApiKey!,
        });

        const messages = [
          LangchainMessages.human("Conte-me uma curiosidade sobre programação."),
        ];

        const result = await langchain.call({
          aiModel: "gpt-4o",
          messages,
          systemPrompt: "Você é um especialista em programação. Responda sempre em português brasileiro.",
        });

        expect(result.text).toBeDefined();
        expect(result.text.length).toBeGreaterThan(0);
        // Verifica que a resposta está relacionada a programação
        expect(
          result.text.toLowerCase().includes("programação") ||
          result.text.toLowerCase().includes("programação") ||
          result.text.toLowerCase().includes("código") ||
          result.text.toLowerCase().includes("software")
        ).toBe(true);
      }
    );
  });

  describe("Structured Output", () => {
    it.skipIf(!shouldRunOpenAITests)(
      "deve retornar resposta estruturada com schema Zod",
      { timeout: 30000 },
      async () => {
        const langchain = new Langchain({
          openAIApiKey: openAIApiKey!,
        });

        const outputSchema = z.object({
          name: z.string(),
          age: z.number(),
          city: z.string(),
        });

        const messages = [
          LangchainMessages.human(
            "Crie uma pessoa fictícia. Nome: João, Idade: 30, Cidade: São Paulo"
          ),
        ];

        const result = await langchain.callStructuredOutput({
          aiModel: "gpt-4o",
          messages,
          outputSchema,
        });

        expect(result.response).toBeDefined();
        expect(result.response.name).toBe("João");
        expect(result.response.age).toBe(30);
        expect(result.response.city).toBe("São Paulo");
      }
    );

    it.skipIf(!shouldRunGeminiTests)(
      "deve retornar resposta estruturada com Gemini",
      { timeout: 30000 },
      async () => {
        const langchain = new Langchain({
          googleGeminiToken: googleGeminiToken!,
        });

        const outputSchema = z.object({
          sum: z.number(),
          product: z.number(),
        });

        const messages = [
          LangchainMessages.human("Calcule a soma e o produto de 5 e 3"),
        ];

        const result = await langchain.callStructuredOutput({
          aiModel: "gemini-2.5-flash",
          messages,
          outputSchema,
        });

        expect(result.response).toBeDefined();
        expect(result.response.sum).toBe(8);
        expect(result.response.product).toBe(15);
      }
    );
  });

  describe("Configurações do modelo", () => {
    it.skipIf(!shouldRunOpenAITests)(
      "deve usar maxTokens e temperature corretamente",
      { timeout: 30000 },
      async () => {
        const langchain = new Langchain({
          openAIApiKey: openAIApiKey!,
        });

        const messages = [
          LangchainMessages.human("Explique o que é TypeScript em uma frase curta."),
        ];

        const result = await langchain.call({
          aiModel: "gpt-4o",
          messages,
          modelConfig: {
            maxTokens: 50,
            temperature: 0.7,
          },
        });

        expect(result.text).toBeDefined();
        expect(result.text.length).toBeLessThan(200); // Deve ser curto devido ao maxTokens
      }
    );
  });

  describe("Múltiplas mensagens em conversa", () => {
    it.skipIf(!shouldRunOpenAITests)(
      "deve manter contexto em múltiplas mensagens",
      { timeout: 30000 },
      async () => {
        const langchain = new Langchain({
          openAIApiKey: openAIApiKey!,
        });

        const messages = [
          LangchainMessages.human("Meu nome é Maria."),
          LangchainMessages.ai("Olá Maria! Prazer em conhecê-la."),
          LangchainMessages.human("Qual é o meu nome?"),
        ];

        const result = await langchain.call({
          aiModel: "gpt-4o",
          messages,
        });

        expect(result.text).toBeDefined();
        expect(result.text.toLowerCase()).toContain("maria");
      }
    );
  });
});
