# Changelog

Todas as mudanças relevantes deste pacote. Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/)
e versionamento [SemVer](https://semver.org/lang/pt-BR/).

## [1.2.2] - 2026-10-22

### Adicionado
- `OpenRouterProviderPreferences` agora aceita `zdr` (exigir providers com
  zero data retention) e `data_collection` (`allow`/`deny`).

### Mudado
- O JSON Schema anexado ao system prompt em structured output agora é
  serializado de forma compacta (sem pretty print), reduzindo o prompt em
  ~245 tokens por chamada sem alterar o contrato.

## [1.2.1] - 2026-10-22

### Corrigido
- Structured output com DeepSeek via OpenRouter quando o reasoning estava ativo:
  o modelo podia devolver texto extra/múltiplos JSONs e o parse falhava. Agora a
  segunda tentativa usa `reasoning: { effort: "none" }` e reforça a instrução de
  retornar um único objeto JSON.
- `parseJsonFromAssistantMessages` extrai o primeiro objeto/array JSON balanceado,
  ignorando texto antes/depois e múltiplos objetos.

### Adicionado
- `reasoningEffort` também é aceito para `openrouter/deepseek/*` e enviado como
  `reasoning: { effort }` no OpenRouter. O tipo `ReasoningEffort` agora inclui
  `"none"`, `"minimal"`, `"xhigh"` e `"max"`.
- Opção `openRouterResponseHealing` para habilitar o plugin `response-healing` do
  OpenRouter. `callStructuredOutput` habilita automaticamente para DeepSeek.

## [1.2.0] - 2026-10-18

Revisão ampla do pacote: empacotamento, exportação de tipos, correções de bugs,
limpeza de código e tooling. Sem breaking change de runtime; a assinatura de
`CreateToolParams` mudou (ver "Mudado").

### Adicionado
- Exportação dos tipos de configuração e de fronteira que faltavam:
  `AIConstructor`, `AICallModelConfig`, `AICallAgentConfig`, `MessageInput`,
  `CreateToolParams`, `OpenAISpeechResponseFormat`.
- Re-export dos tipos de fronteira do LangChain/LangGraph para o consumidor não
  precisar alcançar dependências transitivas: `BaseMessage`, `AgentMiddleware`,
  `ClientTool`, `ServerTool`, `StateSnapshot`.
- Re-export dos tipos de retorno de `AIModels`: `ChatOpenAI`,
  `ChatGoogleGenerativeAI`, `ChatOllama`.
- Exportação das sub-uniões de modelos por provider (`ChatGPTModels`,
  `GeminiModels`, `AnthropicModels`, `DeepSeekModels`, `QwenModels`,
  `MoonshotModels`, `XiaomiModels`, `ZAiModels`, `MiniMaxModels`,
  `OpenRouterModels`, `OllamaModels`, `LocalModels`).
- Escape hatch `| (string & {})` em `AIModelNames` e `AIEmbeddingModelNames`:
  modelo novo passa a ser aceito sem novo release (autocomplete preservado).
- Exportação de `BufferUtils`.
- CI (`.github/workflows/ci.yml`): build, typecheck e testes unitários.
- Novos modelos: OpenAI, Gemini, Anthropic, DeepSeek, Qwen, Moonshot, Xiaomi,
  Z.ai, MiniMax e `gemini-embedding-2`.

### Mudado
- Empacotamento: `files`, `exports`, `types`, `engines`, `sideEffects`,
  metadados (`repository`/`homepage`/`bugs`/`keywords`/`author`); build limpo
  (`clean` antes do `tsc`); `prepublishOnly` roda typecheck + testes + build.
- `CreateToolParams` agora é genérico no schema (`CreateToolParams<TSchema>`):
  `toolFunction` recebe `z.infer<TSchema>` em vez de `unknown`.
- Defaults de retry/backoff extraídos para constantes nomeadas.
- `noUnusedLocals`/`noUnusedParameters` habilitados; rigor do `tests/tsconfig.json`
  alinhado ao do `src`; script `typecheck`.
- Aliases deprecated isolados em `src/deprecated.ts`.
- Áudio e embeddings deixam de depender de helpers duplicados
  (`mapEmbeddingResponse`, `bufferToBase64`).
- README: tabela de modelos atualizada, nota de Zod v4, seção de exports
  deprecated completa.

### Corrigido
- `temperature: 0` (e demais valores falsy válidos) não é mais descartado nos
  modelos OpenAI/OpenRouter/Gemini.
- Structured output tolera `null` em campos `.optional()` (normalização para
  OpenAI pode devolver `null`; agora o parse converte para `undefined`).
- Removido o idioma `"pt"` hardcoded na transcrição de áudio.
- `speakOpenRouterStream` passa a respeitar `instructions` (paridade com a versão
  não-stream).
- Validação de opções de transcrição não muta mais o objeto do chamador.

### Deprecated
- `AIAudio.speak` → `AIAudio.speakOpenAI`
- `AIAudio.speakViaOpenRouter` → `AIAudio.speakOpenRouter`
- `AIAudio.transcribeDetailedOpenRouter` → `AIAudio.transcribeOpenRouter`
- `AIAudio.transcribeWithWhisperLegacy` → `AIAudio.transcribeWithWhisper`

(Todos previstos para remoção na 2.0.0, junto dos aliases `Langchain*` já existentes.)

### Removido
- `FilesUtils` (código morto — nunca exportado nem utilizado).

## [1.1.6] e anteriores

Versões anteriores a este changelog não foram catalogadas aqui.
