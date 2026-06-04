import * as fs from "fs";
import * as path from "path";
import { AIAudio } from "../../src/index";
import "dotenv/config";

const AUDIO_FIXTURE_PATH = path.join(
  process.cwd(),
  "tests",
  "e2e",
  "@fixtures",
  "audio-teste-saudacao.mp3",
);

describe("AIAudio multiprovider E2E", () => {
  const openAIApiKey = process.env.OPENAI_API_KEY;
  const openRouterApiKey = process.env.OPENROUTER_API_KEY;
  const timeout = 120_000;

  it(
    "OpenAI STT + TTS round-trip curto",
    { timeout },
    async () => {
      if (!openAIApiKey) {
        console.log("OPENAI_API_KEY não configurada — pulando");
        return;
      }

      const audioBuffer = fs.readFileSync(AUDIO_FIXTURE_PATH);
      const { text } = await AIAudio.transcribeDetailedOpenAI(
        audioBuffer,
        { languageIn2Digits: "pt", responseFormat: "json" },
        openAIApiKey,
      );

      expect(text.length).toBeGreaterThan(0);

      const speech = await AIAudio.speakOpenAI(
        "OK",
        { voice: "nova", model: "gpt-4o-mini-tts", responseFormat: "mp3" },
        openAIApiKey,
      );

      expect(speech.audio.length).toBeGreaterThan(100);
    },
  );

  it(
    "OpenRouter STT",
    { timeout },
    async () => {
      if (!openRouterApiKey) {
        console.log("OPENROUTER_API_KEY não configurada — pulando");
        return;
      }

      const audioBuffer = fs.readFileSync(AUDIO_FIXTURE_PATH);
      const result = await AIAudio.transcribeOpenRouter(
        audioBuffer,
        {
          model: "openai/gpt-4o-mini-transcribe",
          format: "mp3",
          language: "pt",
        },
        openRouterApiKey,
      );

      expect(result.text.length).toBeGreaterThan(0);
    },
  );

  it(
    "OpenRouter TTS (Gemini — catálogo output_modalities=speech)",
    { timeout },
    async () => {
      if (!openRouterApiKey) {
        console.log("OPENROUTER_API_KEY não configurada — pulando");
        return;
      }

      // Descoberto via GET /api/v1/models?output_modalities=speech
      const speech = await AIAudio.speakOpenRouter(
        "Teste de síntese.",
        {
          model: "google/gemini-3.1-flash-tts-preview",
          voice: "Kore",
        },
        openRouterApiKey,
      );

      expect(speech.audio.length).toBeGreaterThan(100);
      expect(speech.contentType).toBe("audio/pcm");
    },
  );

  it(
    "OpenRouter TTS (Mistral — mp3, requer providers liberados na conta)",
    { timeout },
    async () => {
      if (!openRouterApiKey) {
        console.log("OPENROUTER_API_KEY não configurada — pulando");
        return;
      }

      const speech = await AIAudio.speakOpenRouter(
        "Hello, this is a synthesis test.",
        {
          model: "mistralai/voxtral-mini-tts-2603",
          voice: "en_paul_neutral",
          responseFormat: "mp3",
        },
        openRouterApiKey,
      );

      expect(speech.audio.length).toBeGreaterThan(100);
      expect(speech.contentType).toBe("audio/mpeg");
    },
  );
});
