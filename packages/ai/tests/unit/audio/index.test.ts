import { describe, it, expect } from "vitest";
import { AIAudio, ANTHROPIC_NO_NATIVE_AUDIO } from "../../../src/index.js";

describe("AIAudio facade", () => {
  it("expõe métodos estáticos principais", () => {
    expect(typeof AIAudio.transcribeWithWhisper).toBe("function");
    expect(typeof AIAudio.transcribeDetailedOpenAI).toBe("function");
    expect(typeof AIAudio.transcribeOpenRouter).toBe("function");
    expect(typeof AIAudio.speakOpenAI).toBe("function");
    expect(typeof AIAudio.speakOpenRouter).toBe("function");
    expect(typeof AIAudio.transcribeWithGeminiPrompt).toBe("function");
  });

  it("exporta constante Anthropic", () => {
    expect(ANTHROPIC_NO_NATIVE_AUDIO).toContain("Anthropic");
  });
});
