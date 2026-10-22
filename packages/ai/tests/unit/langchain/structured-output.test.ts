import { describe, expect, it } from "vitest";
import z from "zod";
import {
  buildJsonObjectSystemAppend,
  isDeepSeekJsonObjectOnlyModel,
  parseJsonFromAssistantMessages,
} from "../../../src/langchain/structured-output";

describe("structured-output", () => {
  describe("isDeepSeekJsonObjectOnlyModel", () => {
    it("deve detectar openrouter/deepseek/*", () => {
      expect(
        isDeepSeekJsonObjectOnlyModel("openrouter/deepseek/deepseek-v4-pro"),
      ).toBe(true);
    });

    it("não deve detectar openrouter/openai/*", () => {
      expect(
        isDeepSeekJsonObjectOnlyModel("openrouter/openai/gpt-5-nano"),
      ).toBe(false);
    });
  });

  describe("buildJsonObjectSystemAppend", () => {
    it("deve incluir a palavra json e o schema", () => {
      const append = buildJsonObjectSystemAppend(
        z.object({ name: z.string() }),
      );
      expect(append.toLowerCase()).toContain("json");
      expect(append).toContain("name");
    });
  });

  describe("parseJsonFromAssistantMessages", () => {
    it("deve parsear JSON direto", () => {
      const result = parseJsonFromAssistantMessages([
        { content: '{"a":1}' } as any,
      ]);
      expect(result).toEqual({ a: 1 });
    });

    it("deve parsear JSON em fence markdown", () => {
      const result = parseJsonFromAssistantMessages([
        { content: '```json\n{"b":2}\n```' } as any,
      ]);
      expect(result).toEqual({ b: 2 });
    });

    it("deve ignorar texto depois do JSON", () => {
      const result = parseJsonFromAssistantMessages([
        { content: '{"sum":11}\nEspero que ajude!' } as any,
      ]);
      expect(result).toEqual({ sum: 11 });
    });

    it("deve extrair o primeiro objeto quando o modelo devolve dois JSONs", () => {
      const result = parseJsonFromAssistantMessages([
        { content: '{"sum":11}\n{"sum":12}' } as any,
      ]);
      expect(result).toEqual({ sum: 11 });
    });

    it("deve respeitar chaves dentro de strings ao extrair JSON", () => {
      const result = parseJsonFromAssistantMessages([
        {
          content: '{"text":"chave { dentro } da string"}\n{"extra":true}',
        } as any,
      ]);
      expect(result).toEqual({ text: "chave { dentro } da string" });
    });
  });
});
