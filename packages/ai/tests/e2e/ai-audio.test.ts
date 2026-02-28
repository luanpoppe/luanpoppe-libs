import * as fs from "fs";
import * as path from "path";
import { AI } from "../../src/index";
import { AIMessages } from "../../src/langchain/messages";
import { AIAudioTranscription } from "../../src/langchain/audio-transcription";
import "dotenv/config";

const AUDIO_FIXTURE_PATH = path.join(
  process.cwd(),
  "tests",
  "e2e",
  "@fixtures",
  "audio-teste-saudacao.mp3"
);

describe("AI Audio E2E Tests", () => {
  const openAIApiKey = process.env.OPENAI_API_KEY;
  const googleGeminiToken = process.env.GOOGLE_GEMINI_TOKEN;
  const openRouterApiKey = process.env.OPENROUTER_API_KEY;

  const timeout = 180 * 1000;

  describe("Suporte a áudio", () => {
    it(
      "deve processar áudio com OpenAI usando transcrição prévia automática",
      { timeout },
      async () => {
        if (!openAIApiKey) {
          console.log("OPENAI_API_KEY não está configurada");
          return;
        }
        const ai = new AI({
          openAIApiKey: openAIApiKey!,
        });

        const audioBuffer = fs.readFileSync(AUDIO_FIXTURE_PATH);
        const message = await AIMessages.humanAudio({
          audio: {
            buffer: audioBuffer,
            filename: "audio-teste-saudacao.mp3",
          },
          text: "Este é um teste de áudio transcrito. Responda apenas com 'Áudio recebido'",
          provider: "openai",
          openAIApiKey: openAIApiKey!,
        });

        const result = await ai.call({
          aiModel: "gpt-4o",
          messages: [message],
        });

        console.log({ result });

        expect(result.text).toBeDefined();
        expect(result.text.length).toBeGreaterThan(0);
        expect(result.text).not.toContain("Model call failed");
        expect(result.text).not.toContain("Invalid");
      }
    );

    it.skip(
      "deve processar áudio diretamente com Gemini (multimodal)",
      { timeout },
      async () => {
        if (!googleGeminiToken) {
          console.log("GOOGLE_GEMINI_TOKEN não está configurada");
          return;
        }
        const ai = new AI({
          googleGeminiToken: googleGeminiToken!,
        });

        const audioBuffer = fs.readFileSync(AUDIO_FIXTURE_PATH);

        const message = await AIMessages.humanAudio({
          audio: {
            buffer: audioBuffer,
            mimeType: "audio/mp3",
            filename: "audio-teste-saudacao.mp3",
          },
          text: "Este é um teste de áudio. Responda apenas com 'Áudio recebido'",
          provider: "gemini",
        });

        const result = await ai.call({
          aiModel: "gemini-2.5-flash",
          messages: [message],
        });

        console.log({ result });

        expect(result.text).toBeDefined();
        expect(result.text.length).toBeGreaterThan(0);
      }
    );

    it(
      "deve transcrever áudio com Whisper e depois processar",
      { timeout },
      async () => {
        if (!openAIApiKey) {
          console.log("OPENAI_API_KEY não está configurada");
          return;
        }
        const ai = new AI({
          openAIApiKey: openAIApiKey!,
        });

        const audioBuffer = fs.readFileSync(AUDIO_FIXTURE_PATH);
        const transcribedText =
          await AIAudioTranscription.transcribeWithWhisper(
            audioBuffer,
            { languageIn2Digits: "pt" },
            openAIApiKey!
          );

        const message = AIMessages.human(
          `Áudio transcrito: ${transcribedText}. Responda apenas com 'Transcrição recebida'`
        );

        const result = await ai.call({
          aiModel: "gpt-4o",
          messages: [message],
        });

        console.log({ result });

        expect(result.text).toBeDefined();
        expect(result.text.length).toBeGreaterThan(0);
        expect(transcribedText).toBeDefined();
        expect(transcribedText.length).toBeGreaterThan(0);
      }
    );

    it.skip(
      "deve processar áudio com OpenRouter usando Gemini (multimodal)",
      { timeout },
      async () => {
        if (!openRouterApiKey) {
          console.log("OPENROUTER_API_KEY não está configurada");
          return;
        }
        const ai = new AI({
          openRouterApiKey: openRouterApiKey!,
        });

        const audioBuffer = fs.readFileSync(AUDIO_FIXTURE_PATH);

        const message = await AIMessages.humanAudio({
          audio: {
            buffer: audioBuffer,
            mimeType: "audio/mp3",
            filename: "audio-teste-saudacao.mp3",
          },
          text: "Este é um teste de áudio. Responda apenas com 'Áudio recebido'",
          provider: "gemini",
        });

        const result = await ai.call({
          aiModel: "openrouter/google/gemini-2.5-flash",
          messages: [message],
        });

        console.log({ result });

        expect(result.text).toBeDefined();
        expect(result.text.length).toBeGreaterThan(0);
      }
    );

    it.skip(
      "deve processar áudio com OpenRouter usando GPT (transcrição prévia com Whisper)",
      { timeout },
      async () => {
        if (!openAIApiKey || !openRouterApiKey) {
          console.log(
            "OPENAI_API_KEY e OPENROUTER_API_KEY precisam estar configuradas"
          );
          return;
        }
        const ai = new AI({
          openRouterApiKey: openRouterApiKey!,
        });

        const audioBuffer = fs.readFileSync(AUDIO_FIXTURE_PATH);
        const message = await AIMessages.humanAudio({
          audio: {
            buffer: audioBuffer,
            filename: "audio-teste-saudacao.mp3",
          },
          text: "Este é um teste de áudio transcrito. Responda apenas com 'Áudio recebido'",
          provider: "openai",
          openAIApiKey: openAIApiKey!,
        });

        const result = await ai.call({
          aiModel: "openrouter/openai/gpt-5",
          messages: [message],
        });

        console.log({ result });

        expect(result.text).toBeDefined();
        expect(result.text.length).toBeGreaterThan(0);
        expect(result.text).not.toContain("Model call failed");
        expect(result.text).not.toContain("Invalid");
      }
    );
  });
});
