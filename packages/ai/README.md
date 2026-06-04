# @luanpoppe/ai

TypeScript library for building LLM-powered applications with **OpenAI**, **Google Gemini**, **OpenRouter** (Anthropic, DeepSeek, Qwen, and more), and **local models** via **Ollama** or **OpenAI-compatible** servers (LM Studio, Ollama `/v1`, vLLM, etc.). Built on [LangChain](https://js.langchain.com/) agents and [LangGraph](https://langchain-ai.github.io/langgraph/) checkpointers.

It provides a single `AI` facade for chat, structured JSON output, conversation memory, multimodal messages, a dedicated **`AIAudio`** API for speech-to-text (STT) and text-to-speech (TTS), and **`AIEmbeddings`** for vector embeddings via OpenAI, Google Gemini, and OpenRouter.

---

## Table of contents

- [Installation](#installation)
- [Quick start](#quick-start)
- [Configuration](#configuration)
- [Chat completions (`AI.call`)](#chat-completions-aicall)
- [Structured output (`AI.callStructuredOutput`)](#structured-output-aicallstructuredoutput)
- [Model names](#model-names)
- [Local models (Ollama and LM Studio)](#local-models-ollama-and-lm-studio)
- [OpenRouter provider routing](#openrouter-provider-routing)
- [Retry and model fallback](#retry-and-model-fallback)
- [Messages (`AIMessages`)](#messages-aimessages)
- [Tools (`AITools`)](#tools-aitools)
- [Conversation memory (`AIMemory`)](#conversation-memory-aimemory)
- [Audio (`AIAudio`)](#audio-aiaudio)
- [Embeddings (`AIEmbeddings`)](#embeddings-aiembeddings)
- [Utilities](#utilities)
- [Advanced: raw LangChain agent](#advanced-raw-langchain-agent)
- [Deprecated exports](#deprecated-exports)
- [Development](#development)
- [License](#license)

---

## Installation

```bash
npm install @luanpoppe/ai
# or
pnpm add @luanpoppe/ai
```

**Peer requirements:** Node.js 20+ and API keys for the cloud providers you use. Local models only need a running Ollama or OpenAI-compatible server (no cloud API key).

**Optional dependencies** (install only if you need that checkpointer):

| Package | Use case |
|---------|----------|
| `@langchain/langgraph-checkpoint-sqlite` | SQLite persistence |
| `@langchain/langgraph-checkpoint-postgres` | PostgreSQL persistence |
| `@langchain/langgraph-checkpoint-redis` | Redis persistence |
| `@langchain/langgraph-checkpoint-mongodb` + `mongodb` | MongoDB persistence |

---

## Quick start

```typescript
import { AI, AIMessages } from "@luanpoppe/ai";

const ai = new AI({
  openAIApiKey: process.env.OPENAI_API_KEY,
  openRouterApiKey: process.env.OPENROUTER_API_KEY,
  googleGeminiToken: process.env.GOOGLE_GEMINI_TOKEN,
});

const { text } = await ai.call({
  aiModel: "gpt-4o",
  messages: [AIMessages.human("Say hello in one sentence.")],
});

console.log(text);
```

---

## Configuration

Pass API keys to the `AI` constructor. Keys are read per request based on the model prefix you choose.

```typescript
const ai = new AI({
  openAIApiKey: "sk-...",           // models starting with gpt*
  googleGeminiToken: "...",         // models starting with gemini*
  openRouterApiKey: "sk-or-...",    // models starting with openrouter/*
  aiModelsFallback: ["gpt-4o-mini"], // default fallback list (optional)
  memory: { type: "memory" },       // optional — see AIMemory
});
```

| Constructor option | Description |
|--------------------|-------------|
| `openAIApiKey` | OpenAI API key |
| `googleGeminiToken` | Google AI / Gemini API key |
| `openRouterApiKey` | OpenRouter API key |
| `ollamaBaseUrl` | Ollama native API base URL for `ollama/*` models (default: `http://127.0.0.1:11434`) |
| `localBaseUrl` | OpenAI-compatible base URL for `local/*` models (e.g. `http://localhost:1234/v1` for LM Studio) |
| `localApiKey` | API key sent to the local server (many accept any value; default: `"not-needed"`) |
| `aiModelsFallback` | Default model list used when `aiModelsFallback` is omitted on `call` |
| `memory` | `MemoryConfig` or `AIMemory` instance for thread persistence |
| `checkpointer` | Custom LangGraph `BaseCheckpointSaver` (advanced) |

**Per-call override:** `modelConfig.baseUrl` overrides `ollamaBaseUrl` / `localBaseUrl` for that request. For Ollama, `modelConfig.numCtx` sets context window size.

---

## Chat completions (`AI.call`)

```typescript
import { AI, AIMessages } from "@luanpoppe/ai";

const { text, messages } = await ai.call({
  aiModel: "openrouter/anthropic/claude-sonnet-4.6",
  systemPrompt: "You are a helpful assistant.",
  messages: [
    AIMessages.human("What is 2 + 2?"),
  ],
  modelConfig: {
    temperature: 0.2,
    maxTokens: 1024,
    // OpenRouter-only:
    openRouterProvider: { sort: "price" },
    openRouterAllowAllProviders: true,
  },
  maxRetries: 3,
  threadId: "user-123", // required when memory/checkpointer is enabled
});
```

### Parameters (`AICallParams`)

| Field | Description |
|-------|-------------|
| `aiModel` | Model id — see [Model names](#model-names) |
| `messages` | `SystemMessage`, `HumanMessage`, or `AIMessage` (from `AIMessages` or LangChain) |
| `systemPrompt` | Optional system instructions |
| `modelConfig` | `maxTokens`, `temperature`, `reasoningEffort` (OpenAI), `baseUrl`, `numCtx` (Ollama), OpenRouter provider options |
| `maxRetries` | Retries per model via LangChain `modelRetryMiddleware` (default: 3) |
| `aiModelsFallback` | Try these models if the primary fails after retries |
| `threadId` | Conversation id when using memory/checkpointer |
| `agent.tools` | LangChain tools |
| `agent.middleware` | Extra agent middleware |

---

## Structured output (`AI.callStructuredOutput`)

Returns JSON validated with a **Zod** schema.

```typescript
import z from "zod";
import { AI, AIMessages } from "@luanpoppe/ai";

const schema = z.object({
  name: z.string(),
  age: z.number(),
});

const { response } = await ai.callStructuredOutput({
  aiModel: "gpt-4o",
  outputSchema: schema,
  messages: [AIMessages.human("Extract: João is 30 years old.")],
});

// response: { name: "João", age: 30 }
```

### OpenAI / OpenRouter (GPT)

Uses LangChain `responseFormat` with JSON schema. Optional fields (`.optional()`) are normalized to `.nullable()` for OpenAI compatibility.

### DeepSeek via OpenRouter

DeepSeek models do **not** support `json_schema`. The library automatically:

1. Sets `response_format: { type: "json_object" }` on OpenRouter
2. Merges the Zod schema into the system prompt
3. Parses JSON from the assistant message if `structuredResponse` is missing

```typescript
await ai.callStructuredOutput({
  aiModel: "openrouter/deepseek/deepseek-v4-flash",
  outputSchema: schema,
  messages: [AIMessages.human("Return JSON only.")],
});
```

### Local models (`ollama/*`, `local/*`)

Structured output uses LangChain `responseFormat` when the model supports it. Capability varies by model; see [Local models](#local-models-ollama-and-lm-studio).

---

## Model names

`AIModelNames` is a TypeScript union for autocomplete and safety.

| Prefix | Provider | Example |
|--------|----------|---------|
| `gpt-*`, `o3`, `o4-mini` | OpenAI | `"gpt-4o"`, `"gpt-5.4"` |
| `gemini-*` | Google Gemini | `"gemini-2.5-flash"` |
| `openrouter/<provider>/<model>` | OpenRouter | `"openrouter/deepseek/deepseek-v4-flash"` |
| `ollama/<model>` | Ollama (native API) | `"ollama/llama3.2"`, `"ollama/qwen2.5:7b"` |
| `local/<model>` | OpenAI-compatible local server | `"local/meta-llama/Llama-3.2-3B-Instruct"` |

OpenRouter slug format: `openrouter/{provider}/{model}` — e.g. `openrouter/openai/gpt-4o`, `openrouter/anthropic/claude-sonnet-4.6`, `openrouter/google/gemini-2.5-flash`.

For `ollama/*` and `local/*`, the segment after the prefix must match the model name on your server (`ollama list` or LM Studio model id).

Use `AIModels` directly if you need low-level LangChain chat models:

```typescript
import { AIModels } from "@luanpoppe/ai";

const model = AIModels.openrouter({
  model: "deepseek/deepseek-v4-flash",
  apiKey: process.env.OPENROUTER_API_KEY!,
});

const ollama = AIModels.ollama({
  model: "llama3.2",
  baseUrl: "http://127.0.0.1:11434",
});

const lmStudio = AIModels.openaiCompatible({
  model: "your-model-id",
  baseURL: "http://localhost:1234/v1",
});
```

---

## Local models (Ollama and LM Studio)

Run LLMs on your machine without cloud API keys. Two prefixes cover the common setups:

| Prefix | Server | Typical URL |
|--------|--------|-------------|
| `ollama/` | [Ollama](https://ollama.com/) native API | `http://127.0.0.1:11434` |
| `local/` | LM Studio, Ollama OpenAI mode (`/v1`), vLLM, LocalAI | `http://localhost:1234/v1` or `http://127.0.0.1:11434/v1` |

### Quick example

```typescript
const ai = new AI({
  ollamaBaseUrl: "http://127.0.0.1:11434",
  localBaseUrl: "http://localhost:1234/v1", // LM Studio local server
  localApiKey: "lm-studio", // optional — many servers ignore this
});

// Ollama: ollama pull llama3.2 first
const { text: fromOllama } = await ai.call({
  aiModel: "ollama/llama3.2",
  messages: [AIMessages.human("Hello!")],
});

// LM Studio: start the local server and use the exact model id shown in the UI
const { text: fromLmStudio } = await ai.call({
  aiModel: "local/your-model-id",
  messages: [AIMessages.human("Hello!")],
});
```

### Ollama via OpenAI-compatible API

If you prefer a single integration style, point `localBaseUrl` at Ollama’s OpenAI endpoint and use the `local/` prefix:

```typescript
const ai = new AI({
  localBaseUrl: "http://127.0.0.1:11434/v1",
});

await ai.call({
  aiModel: "local/llama3.2",
  messages: [AIMessages.human("Hello!")],
});
```

### Structured output and tools

- **`callStructuredOutput`:** support depends on the local model. Small models may need plain JSON in the reply; the library does not apply OpenAI schema normalization to `ollama/*` or `local/*`.
- **Tools (`agent.tools`):** requires a model with function calling (e.g. some Llama 3.1+ variants on Ollama).
- **Audio:** STT/TTS stays on `AIAudio` (cloud APIs). Local chat does not replace Whisper/TTS.
- **Fallback:** `aiModelsFallback` can mix local and cloud models, e.g. `["gpt-4o-mini"]` after `ollama/llama3.2`.

### Constants

```typescript
import { DEFAULT_OLLAMA_BASE_URL, DEFAULT_LOCAL_API_KEY } from "@luanpoppe/ai";
```

---

## OpenRouter provider routing

Control which upstream hosts OpenRouter uses ([docs](https://openrouter.ai/docs/guides/routing/provider-selection)).

```typescript
await ai.call({
  aiModel: "openrouter/deepseek/deepseek-v4-pro",
  messages: [...],
  modelConfig: {
    // Custom routing (overrides defaults):
    openRouterProvider: {
      only: ["deepseek"],
      sort: "price",
      max_price: { prompt: 1, completion: 2 },
    },
    // Or allow OpenRouter’s default routing for all providers:
    openRouterAllowAllProviders: true,
  },
});
```

**Default behavior:** for models whose slug starts with `deepseek/`, the library applies `provider: { only: ["deepseek"] }` unless you pass `openRouterProvider` or `openRouterAllowAllProviders: true`.

`resolveOpenRouterProvider(model, config)` is exported if you build custom OpenRouter requests.

---

## Retry and model fallback

1. **Retries:** `maxRetries` (default 3) with exponential backoff on the same model.
2. **Fallback:** if all retries fail, the next model in `aiModelsFallback` is tried.

```typescript
await ai.call({
  aiModel: "openrouter/deepseek/deepseek-v4-flash",
  aiModelsFallback: [
    "openrouter/openai/gpt-4o-mini",
    "gpt-4o-mini",
  ],
  messages: [...],
});
```

---

## Messages (`AIMessages`)

Helpers for LangChain message types.

```typescript
import { AIMessages } from "@luanpoppe/ai";

AIMessages.system("You are a tutor.");
AIMessages.human("Explain recursion.");
AIMessages.ai("Recursion is...");
```

### Images (multimodal)

```typescript
const msg = AIMessages.humanImage({
  image: { buffer: imageBuffer, filename: "photo.jpg" },
  text: "Describe this image.",
});
```

### Audio in chat

OpenAI and Anthropic chat APIs do not accept raw audio in the same way as Gemini. This library handles that for you:

| `provider` | Behavior |
|------------|----------|
| `"gemini"` | Native audio block (multimodal) |
| `"openai"` | Pre-transcribes with Whisper, sends text |
| `"openrouter"` | Pre-transcribes via OpenRouter STT, sends text |
| `"auto"` | OpenAI key → OpenAI; else OpenRouter key → OpenRouter; else Gemini |

```typescript
const msg = await AIMessages.humanAudio({
  audio: { buffer: audioBuffer, filename: "note.mp3" },
  text: "Summarize this recording.",
  provider: "openai",
  openAIApiKey: process.env.OPENAI_API_KEY,
});

await ai.call({ aiModel: "gpt-4o", messages: [msg] });
```

> **Anthropic:** there is no native public STT/TTS API. Use STT first, then chat. The constant `ANTHROPIC_NO_NATIVE_AUDIO` documents this limitation.

---

## Tools (`AITools`)

Wrap LangChain tools with Zod schemas:

```typescript
import z from "zod";
import { AITools } from "@luanpoppe/ai";

const tools = new AITools();

const getWeather = tools.createTool({
  name: "get_weather",
  description: "Get weather for a city",
  schema: z.object({ city: z.string() }),
  toolFunction: async ({ city }) => `Weather in ${city}: sunny`,
});

await ai.call({
  aiModel: "gpt-4o",
  messages: [AIMessages.human("Weather in Paris?")],
  agent: { tools: [getWeather] },
});
```

---

## Conversation memory (`AIMemory`)

Persist multi-turn conversations with LangGraph checkpointers.

```typescript
const ai = new AI({
  openAIApiKey: process.env.OPENAI_API_KEY!,
  memory: { type: "sqlite", connectionString: "./chat.db" },
});

await ai.call({
  aiModel: "gpt-4o",
  threadId: "session-42",
  messages: [AIMessages.human("My name is Ana.")],
});

await ai.call({
  aiModel: "gpt-4o",
  threadId: "session-42",
  messages: [AIMessages.human("What is my name?")],
});

const { messages } = await ai.memory.getHistory("session-42");
```

### Checkpointer types

| `type` | Config |
|--------|--------|
| `"memory"` | In-memory (dev/tests) |
| `"sqlite"` | `{ connectionString: "./data.db" }` or `":memory:"` |
| `"postgres"` | `{ connectionString: "postgresql://..." }` |
| `"redis"` | `{ url: "redis://..." }` |
| `"mongodb"` | `{ url: "..." }` or `{ client: mongoClient }` |

When `memory` or `checkpointer` is set, **`threadId` is required** on every `call` / `callStructuredOutput`.

---

## Audio (`AIAudio`)

Standalone STT/TTS APIs (not coupled to `AI.call`). Pass API keys as method arguments.

### OpenAI — speech-to-text

```typescript
import { AIAudio } from "@luanpoppe/ai";
import fs from "fs";

const buffer = fs.readFileSync("meeting.mp3");

// Simple text
const text = await AIAudio.transcribeWithWhisper(
  buffer,
  { languageIn2Digits: "pt" },
  process.env.OPENAI_API_KEY,
);

// Rich response (words, segments, duration)
const detailed = await AIAudio.transcribeDetailedOpenAI(
  buffer,
  {
    model: "whisper-1",
    responseFormat: "verbose_json",
    timestampGranularities: ["word", "segment"],
  },
  process.env.OPENAI_API_KEY,
);

// Subtitles
const srt = await AIAudio.transcribeToSrtOpenAI(buffer, {}, apiKey);
const vtt = await AIAudio.transcribeToVttOpenAI(buffer, {}, apiKey);

// Speaker diarization
const diarized = await AIAudio.transcribeDiarizedOpenAI(buffer, {}, apiKey);

// Translate to English
const english = await AIAudio.translateOpenAI(buffer, {}, apiKey);
```

Supported Whisper / transcription models include `whisper-1`, `gpt-4o-transcribe`, `gpt-4o-mini-transcribe`, and `gpt-4o-transcribe-diarize`.

### OpenAI — text-to-speech

```typescript
const { audio, contentType } = await AIAudio.speakOpenAI(
  "Hello!",
  {
    model: "gpt-4o-mini-tts",
    voice: "nova",
    instructions: "Speak warmly.", // gpt-4o-mini-tts* only
    responseFormat: "mp3",
  },
  process.env.OPENAI_API_KEY,
);

// Streaming
const stream = await AIAudio.speakOpenAIStream("Hello!", { voice: "nova" }, apiKey);
```

### OpenRouter — STT

Uses `POST https://openrouter.ai/api/v1/audio/transcriptions`.

```typescript
const { text, usage } = await AIAudio.transcribeOpenRouter(
  buffer,
  {
    model: "openai/gpt-4o-mini-transcribe",
    format: "mp3",
    language: "pt",
    openRouterProvider: { sort: "price" },
  },
  process.env.OPENROUTER_API_KEY,
);
```

### OpenRouter — TTS

Uses `POST https://openrouter.ai/api/v1/audio/speech`.

Discover models:

```http
GET https://openrouter.ai/api/v1/models?output_modalities=speech
```

Each model lists `supported_voices` in the response.

```typescript
// Gemini TTS (pcm only on OpenRouter)
const gemini = await AIAudio.speakOpenRouter(
  "Summary of the day.",
  {
    model: "google/gemini-3.1-flash-tts-preview",
    voice: "Kore",
    // responseFormat defaults to "pcm" for gemini*TTS* models
  },
  process.env.OPENROUTER_API_KEY,
);

// Mistral TTS (mp3)
const mistral = await AIAudio.speakOpenRouter(
  "Hello world.",
  {
    model: "mistralai/voxtral-mini-tts-2603",
    voice: "en_paul_neutral",
    responseFormat: "mp3",
  },
  process.env.OPENROUTER_API_KEY,
);
```

> Enable the required **providers** in your OpenRouter account settings if you get `No allowed providers are available`.

### Gemini — transcription helper

Multimodal transcription without `@google/genai` (uses LangChain + your Gemini token):

```typescript
const transcript = await AIAudio.transcribeWithGeminiPrompt(
  buffer,
  {
    model: "gemini-2.5-flash",
    prompt: "Transcribe with approximate [mm:ss] timestamps.",
    googleGeminiToken: process.env.GOOGLE_GEMINI_TOKEN,
  },
);
```

### `AIAudio` method reference

| Method | Description |
|--------|-------------|
| `transcribeWithWhisper` | OpenAI STT → plain text |
| `transcribeDetailedOpenAI` | OpenAI STT → detailed object |
| `transcribeToSrtOpenAI` / `transcribeToVttOpenAI` | Subtitle formats |
| `transcribeDiarizedOpenAI` | Speaker diarization |
| `translateOpenAI` | Translate audio to English |
| `transcribeFileWithWhisper` / `transcribeFileDetailedOpenAI` | File path variants |
| `transcribeOpenRouter` | OpenRouter STT |
| `speakOpenAI` / `speakOpenAIStream` | OpenAI TTS |
| `speakOpenRouter` / `speakOpenRouterStream` | OpenRouter TTS |
| `transcribeWithGeminiPrompt` | Gemini multimodal STT |

---

## Embeddings (`AIEmbeddings`)

Standalone embedding APIs (not coupled to `AI.call`). Use typed model names from `AIEmbeddingModelNames` (separate from chat `AIModelNames`).

> **Anthropic:** there is no public Anthropic embeddings API. The package exports `ANTHROPIC_NO_NATIVE_EMBEDDINGS`. Vectorize text with OpenAI, Gemini, or OpenRouter before using `openrouter/anthropic/*` chat models in RAG pipelines.

### TypeScript types

```typescript
import {
  AIEmbeddings,
  type AIEmbeddingModelNames,
  type EmbeddingResult,
  type EmbedOptions,
  type EmbedApiKeys,
  ANTHROPIC_NO_NATIVE_EMBEDDINGS,
} from "@luanpoppe/ai";

const model: AIEmbeddingModelNames = "text-embedding-3-small";
```

### OpenAI

```typescript
import { AIEmbeddings } from "@luanpoppe/ai";

const { embeddings, usage } = await AIEmbeddings.embedOpenAI(
  ["Document one.", "Document two."],
  { model: "text-embedding-3-small", dimensions: 512 },
  process.env.OPENAI_API_KEY,
);

const queryVector = await AIEmbeddings.embedQuery(
  "search query",
  { model: "text-embedding-3-large" },
  { openAIApiKey: process.env.OPENAI_API_KEY },
);
```

Supported direct models: `text-embedding-3-small`, `text-embedding-3-large`, `text-embedding-ada-002`.

Optional: `dimensions` (for `text-embedding-3-*`) and `encodingFormat: "float" | "base64"` (default: `"float"`).

### Google Gemini

```typescript
const vectors = await AIEmbeddings.embedDocuments(
  ["chunk a", "chunk b"],
  {
    model: "gemini-embedding-001",
    taskType: "RETRIEVAL_DOCUMENT",
    dimensions: 768,
  },
  { googleGeminiToken: process.env.GOOGLE_GEMINI_TOKEN },
);
```

Models: `gemini-embedding-001`, `gemini-embedding-2-preview` (text via this API; multimodal inputs require the Google GenAI SDK directly).

For `gemini-embedding-001`, when `dimensions` is set below the native 3072 (e.g. `768`), the library truncates the vector and applies **L2 normalization** so cosine similarity remains meaningful.

### OpenRouter

OpenAI-compatible `POST /api/v1/embeddings` with provider routing.

```typescript
const result = await AIEmbeddings.embedOpenRouter(
  "Semantic search benchmark.",
  {
    model: "openrouter/openai/text-embedding-3-small",
    openRouterAllowAllProviders: true,
  },
  process.env.OPENROUTER_API_KEY,
);
```

Discover models:

```http
GET https://openrouter.ai/api/v1/embeddings/models
```

Typed OpenRouter examples: `openrouter/google/gemini-embedding-001`, `openrouter/qwen/qwen3-embedding-8b`, `openrouter/BAAI/bge-m3`.

Supports `dimensions`, `encodingFormat`, `openRouterProvider`, and `openRouterAllowAllProviders` (enable all providers in your OpenRouter account if routing fails).

### Routing helpers

```typescript
// Auto-route by model prefix (text-embedding-* | gemini-embedding-* | openrouter/*)
await AIEmbeddings.embed("text", {
  model: "openrouter/openai/text-embedding-3-small",
}, {
  openRouterApiKey: process.env.OPENROUTER_API_KEY,
});
```

### `AIEmbeddings` method reference

| Method | Description |
|--------|-------------|
| `embedOpenAI` | OpenAI `embeddings.create` |
| `embedGemini` | LangChain `GoogleGenerativeAIEmbeddings` |
| `embedOpenRouter` | OpenRouter embeddings + `resolveOpenRouterProvider` |
| `embed` | Routes by model prefix |
| `embedDocuments` | Batch embed (default Gemini task: `RETRIEVAL_DOCUMENT`) |
| `embedQuery` | Single query vector (default Gemini task: `RETRIEVAL_QUERY`) |

---

## Utilities

```typescript
import { AudioUtils, ImageUtils } from "@luanpoppe/ai";

AudioUtils.bufferToBase64(buffer);
AudioUtils.detectAudioMimeType(buffer, "audio.mp3");

ImageUtils.bufferToBase64(buffer);
ImageUtils.detectImageMimeType(buffer, "photo.png");
```

---

## Advanced: raw LangChain agent

For full control over the LangGraph agent:

```typescript
const { agent } = await ai.getRawAgent({
  aiModel: "gpt-4o",
  messages: [],
  threadId: "t-1",
});

const state = await agent.invoke(
  { messages: [AIMessages.human("Hi")] },
  { configurable: { thread_id: "t-1" } },
);
```

---

## Deprecated exports

These aliases remain for backward compatibility and will be removed in **v2.0.0**:

| Deprecated | Use instead |
|------------|-------------|
| `Langchain` | `AI` |
| `LangchainModels` | `AIModels` |
| `LangchainMessages` | `AIMessages` |
| `LangchainTools` | `AITools` |
| `AIAudioTranscription` | `AIAudio` |

---

## Development

From `packages/ai`:

```bash
pnpm install
pnpm build          # compile to dist/
pnpm test:unit      # unit tests (mocked APIs)
pnpm test:e2e       # live API tests — requires .env keys
```

Copy `.env.example` to `.env` and set:

- `OPENAI_API_KEY`
- `GOOGLE_GEMINI_TOKEN`
- `OPENROUTER_API_KEY`

Targeted E2E suites:

```bash
pnpm test:e2e -- ai-embeddings          # OpenAI + Gemini + OpenRouter embeddings
pnpm test:e2e -- ai-audio-multiprovider # STT/TTS multiprovider
pnpm test:e2e -- ai-deepseek-structured-output
pnpm test:e2e -- ai-local-models        # Ollama + LM Studio (optional)
```

For `ai-local-models`:

- `OLLAMA_E2E=1` with Ollama running (`ollama serve`, model pulled)
- `LOCAL_BASE_URL` + `LOCAL_MODEL_NAME` with LM Studio (or similar) server active

See `tests/e2e/README.md` for E2E details.

### Known issue (Windows + Whisper file upload)

If you hit file-upload errors with Whisper on Windows, see [docs/LANGCHAIN_WHISPER_WINDOWS_BUG.md](./docs/LANGCHAIN_WHISPER_WINDOWS_BUG.md). This package uses the OpenAI SDK `toFile` helper directly in `AIAudio` to avoid the LangChain loader bug.

---

## License

ISC
