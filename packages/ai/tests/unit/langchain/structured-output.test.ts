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
  });
});
