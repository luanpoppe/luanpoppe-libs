import { SystemMessage, HumanMessage, AIMessage } from "langchain";
import { AudioUtils } from "../utils/audio-utils";
import { ImageUtils } from "../utils/image-utils";
import type { AudioBuffer, AudioMimeType } from "../@types/audio";
import type { ImageBuffer, ImageMimeType } from "../@types/image";
import { AIAudio } from "../audio";

export type MessageInput = SystemMessage | HumanMessage | AIMessage;

export type ImageContentBlock = {
  type: "image";
  source_type: "base64";
  data: string;
  mime_type: ImageMimeType;
  metadata?: Record<string, unknown>;
};

export type HumanMessageWithImageOptions = {
  image: {
    buffer: ImageBuffer;
    mimeType?: ImageMimeType;
    filename?: string;
  };
  text?: string;
};

export type AudioContentBlock = {
  type: "audio";
  source_type: "base64";
  data: string;
  mime_type: AudioMimeType;
  metadata?: Record<string, unknown>;
};

export type HumanMessageWithAudioOptions = {
  audio: {
    buffer: AudioBuffer;
    mimeType?: AudioMimeType;
    filename?: string;
  };
  text?: string;
  provider?: "openai" | "gemini" | "openrouter" | "auto";
  openAIApiKey?: string;
  openRouterApiKey?: string;
  /** Modelo OpenRouter STT (ex.: openai/whisper-1) quando provider é openrouter ou auto com OR */
  openRouterTranscriptionModel?: string;
};

export class AIMessages {
  static system(message: string): SystemMessage {
    return new SystemMessage(message);
  }

  static human(message: string): HumanMessage {
    return new HumanMessage(message);
  }

  static humanImage(options: HumanMessageWithImageOptions): HumanMessage {
    const { image, text } = options;
    const { buffer, mimeType, filename } = image;

    const base64Data = ImageUtils.bufferToBase64(buffer);
    const detectedMimeType =
      mimeType ?? ImageUtils.detectImageMimeType(buffer, filename);

    const content: Array<{ type: "text"; text: string } | ImageContentBlock> =
      [];

    if (text) {
      content.push({ type: "text", text });
    }

    const imageBlock: ImageContentBlock = {
      type: "image",
      source_type: "base64",
      data: base64Data,
      mime_type: detectedMimeType,
    };
    content.push(imageBlock);

    return new HumanMessage({
      content: content as any,
    } as any);
  }

  static async humanAudio(
    options: HumanMessageWithAudioOptions
  ): Promise<HumanMessage> {
    const {
      audio,
      text,
      provider = "auto",
      openAIApiKey,
      openRouterApiKey,
      openRouterTranscriptionModel,
    } = options;
    const { buffer, mimeType, filename } = audio;

    const resolvedProvider = this.resolveAudioProvider(
      provider,
      openAIApiKey,
      openRouterApiKey,
    );

    return this.createHumanMessageWithAudio(
      buffer,
      text,
      mimeType,
      filename,
      resolvedProvider,
      openAIApiKey,
      openRouterApiKey,
      openRouterTranscriptionModel,
    );
  }

  static ai(message: string): AIMessage {
    return new AIMessage(message);
  }

  private static resolveAudioProvider(
    provider: "openai" | "gemini" | "openrouter" | "auto",
    openAIApiKey?: string,
    openRouterApiKey?: string,
  ): "openai" | "gemini" | "openrouter" {
    if (provider !== "auto") return provider;
    if (openAIApiKey) return "openai";
    if (openRouterApiKey) return "openrouter";
    return "gemini";
  }

  private static async createHumanMessageWithAudio(
    audioBuffer: AudioBuffer,
    text?: string,
    mimeType?: AudioMimeType,
    filename?: string,
    provider: "openai" | "gemini" | "openrouter" = "gemini",
    openAIApiKey?: string,
    openRouterApiKey?: string,
    openRouterTranscriptionModel = "openai/whisper-1",
  ): Promise<HumanMessage> {
    if (provider === "openai") {
      return await this.processAudioOpenAi(
        audioBuffer,
        mimeType,
        text,
        openAIApiKey,
      );
    }

    if (provider === "openrouter") {
      return await this.processAudioOpenRouter(
        audioBuffer,
        mimeType,
        text,
        openRouterApiKey,
        openRouterTranscriptionModel,
      );
    }

    // Para Gemini e outros, usa multimodal direto (trabalho síncrono, mas retorna Promise para compatibilidade)
    const base64Data = AudioUtils.bufferToBase64(audioBuffer);
    const detectedMimeType =
      mimeType || AudioUtils.detectAudioMimeType(audioBuffer, filename);

    const content: Array<any> = [];

    // Se há texto, adiciona como objeto (obrigatório quando há áudio multimodal)
    // O LangChain requer que todos os elementos do array sejam objetos quando há conteúdo multimodal
    if (text) {
      content.push({
        type: "text",
        text: text,
      });
    }

    // Para Gemini e outros providers, usa formato padrão StandardAudioBlock
    // Funciona perfeitamente com dados inline usando formato padrão
    const audioBlock: AudioContentBlock = {
      type: "audio",
      source_type: "base64",
      data: base64Data,
      mime_type: detectedMimeType,
    };
    content.push(audioBlock);

    // Usa 'as any' para compatibilidade com tipos do LangChain
    // O LangChain aceita estruturas flexíveis para conteúdo multimodal
    return new HumanMessage({
      content: content as any,
    } as any);
  }

  private static async processAudioOpenAi(
    audioBuffer: AudioBuffer,
    mimeType?: AudioMimeType,
    text?: string,
    openAIApiKey?: string
  ) {
    if (!openAIApiKey)
      throw new Error(
        "openAIApiKey é necessária quando provider é 'openai'. Forneça a chave da API da OpenAI para fazer transcrição prévia com Whisper."
      );

    try {
      // Prepara opções de transcrição - só inclui language se não houver mimeType
      // Com exactOptionalPropertyTypes: true, não podemos passar undefined explicitamente
      const transcriptionOptions = mimeType
        ? { format: mimeType }
        : { language: "pt" };

      const transcribedText = await AIAudio.transcribeWithWhisper(
        audioBuffer,
        transcriptionOptions,
        openAIApiKey,
      );

      // Combina o texto original (se fornecido) com a transcrição
      const finalText = text
        ? `${text}\n\nÁudio transcrito: ${transcribedText}`
        : `Áudio transcrito: ${transcribedText}`;

      // Retorna uma mensagem de texto simples com a transcrição
      return new HumanMessage(finalText);
    } catch (error) {
      // Se a transcrição falhar, lança erro informativo
      // Não tenta formato multimodal pois sabemos que não funciona para OpenAI
      throw new Error(
        `Falha na transcrição prévia com Whisper para OpenAI: ${
          error instanceof Error ? error.message : String(error)
        }. ` +
          "Certifique-se de que o arquivo de áudio é válido e está em um formato suportado (mp3, wav, etc.)."
      );
    }
  }

  private static async processAudioOpenRouter(
    audioBuffer: AudioBuffer,
    mimeType?: AudioMimeType,
    text?: string,
    openRouterApiKey?: string,
    openRouterTranscriptionModel = "openai/whisper-1",
  ) {
    if (!openRouterApiKey) {
      throw new Error(
        "openRouterApiKey é necessária quando provider é 'openrouter'.",
      );
    }

    const format = mimeType ?? AudioUtils.detectAudioMimeType(audioBuffer);
    const { text: transcribedText } = await AIAudio.transcribeOpenRouter(
      audioBuffer,
      {
        model: openRouterTranscriptionModel,
        format,
        ...(text ? {} : { language: "pt" }),
      },
      openRouterApiKey,
    );

    const finalText = text
      ? `${text}\n\nÁudio transcrito: ${transcribedText}`
      : `Áudio transcrito: ${transcribedText}`;

    return new HumanMessage(finalText);
  }
}
