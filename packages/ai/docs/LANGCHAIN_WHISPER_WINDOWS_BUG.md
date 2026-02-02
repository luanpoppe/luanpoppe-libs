# Bug do LangChain no Windows: Transcrição de Áudio com Whisper - 2026-02-02

## Resumo

O loader `OpenAIWhisperAudio` do LangChain passa o **caminho completo do arquivo** (ex: `C:\Users\...\whisper-xxx.webm`) para a API da OpenAI. No Windows, isso pode causar falhas no envio multipart devido a backslashes e caracteres especiais no path.

---

## Passo a passo: O que acontece quando você transcreve áudio

### 1. Seu código chama a transcrição

```typescript
// No seu código (@luanpoppe/ai)
const tempFilePath = FilesUtils.createTempFile(audioBuffer, "whisper", options.format);
// tempFilePath = "C:\Users\luan\AppData\Local\Temp\whisper-1738512345-abc123.webm"

const loader = new OpenAIWhisperAudio(tempFilePath, { ... });
const docs = await loader.load();
```

Você cria um arquivo temporário e passa o **caminho completo** para o loader do LangChain.

---

### 2. O LangChain lê o arquivo

O `OpenAIWhisperAudio` estende `BufferLoader`. Internamente, ele:

1. Lê o conteúdo do arquivo em memória (um `Buffer`)
2. Guarda o caminho original em `metadata.source`

```javascript
// Dentro do BufferLoader (simplificado)
metadata = {
  source:
    "C:\\Users\\luan\\AppData\\Local\\Temp\\whisper-1738512345-abc123.webm",
};
```

---

### 3. O LangChain chama a API da OpenAI

O método `parse()` do loader faz algo assim:

```javascript
// Código atual do LangChain (com o bug)
const fileName = metadata.source === "blob" ? metadata.blobType : metadata.source;
// fileName = "C:\Users\luan\AppData\Local\Temp\whisper-1738512345-abc123.webm"

const transcriptionResponse = await this.openAIClient.audio.transcriptions.create({
  file: await toFile(raw, fileName),  // ← O problema está aqui!
  model: "whisper-1",
  ...
});
```

O segundo parâmetro de `toFile(raw, fileName)` deveria ser **apenas o nome do arquivo** (ex: `whisper-1738512345-abc123.webm`), mas o LangChain passa o **caminho completo**.

---

### 4. O que a API da OpenAI espera

A função `toFile` da OpenAI usa o segundo parâmetro para:

- Definir o nome do arquivo no formulário multipart (Content-Disposition)
- Ajudar a API a identificar o formato do áudio pela extensão

O formato multipart espera algo como:

```
Content-Disposition: form-data; name="file"; filename="whisper-xxx.webm"
```

Com o caminho completo do Windows:

```
Content-Disposition: form-data; name="file"; filename="C:\Users\luan\AppData\Local\Temp\whisper-xxx.webm"
```

Os backslashes (`\`) e o path longo podem causar:

- Parsing incorreto do header
- Erros de encoding
- Rejeição pela API

---

## Por que não dá para resolver no seu código?

### O fluxo de dados

```
Seu código                    LangChain (biblioteca)              API OpenAI
    |                                |                                  |
    |  tempFilePath (path completo)  |                                  |
    | ----------------------------->|                                  |
    |                                |  Lê arquivo, guarda em metadata   |
    |                                |  metadata.source = path completo  |
    |                                |                                  |
    |                                |  toFile(buffer, metadata.source)  |
    |                                |  ↑ usa path completo internamente |
    |                                | --------------------------------->|
    |                                |                    Envio multipart|
```

### Onde está o controle?

| Etapa                   | Quem controla | O que você pode fazer                                             |
| ----------------------- | ------------- | ----------------------------------------------------------------- |
| Criar arquivo temp      | **Você**      | Escolher onde criar (ex: `os.tmpdir()`)                           |
| Path passado ao loader  | **Você**      | Só pode passar um path – o loader precisa dele para ler o arquivo |
| Valor usado em `toFile` | **LangChain** | Você não tem acesso – é interno ao loader                         |
| Chamada à API           | **LangChain** | Você não controla                                                 |

### O problema central

O loader **precisa** do path completo para **ler o arquivo** do disco. Não há como passar “só o nome” – o LangChain precisa do path para fazer `fs.readFile` (ou equivalente).

Depois de ler, o loader usa o mesmo `metadata.source` (o path) como nome do arquivo no `toFile`. A decisão de usar `metadata.source` em vez de `path.basename(metadata.source)` está **dentro do LangChain**, não no seu código.

### Por que não dá para “enganar” o loader?

**Tentativa 1: Criar o arquivo em um path curto**

```typescript
// Ex: ./whisper-temp.webm
const tempFilePath = path.join(process.cwd(), "whisper-temp.webm");
```

Ainda assim, `metadata.source` será algo como `C:\projeto\whisper-temp.webm`. O path continua completo; o LangChain continua passando ele para `toFile`.

**Tentativa 2: Passar um Blob em vez de path**

O loader aceita `string | Blob`. Se você passar um Blob, `metadata.source === "blob"` e ele usa `metadata.blobType` (ex: `"audio/webm"`). O Blob não tem path, então não há problema de Windows.

Porém: o LangChain não expõe uma forma simples de criar o loader a partir de um Buffer/Blob com controle total do fluxo. E o `BufferLoader` espera um Blob do browser ou um path de arquivo – em Node.js, o uso típico é com path.

**Tentativa 3: Wrapper ou monkey-patch**

Você poderia tentar interceptar ou substituir o loader, mas:

- O loader é instanciado internamente
- Você não controla o que é passado para `toFile`
- Faria seu código depender de detalhes internos do LangChain, frágeis a atualizações

---

## Correção sugerida (no LangChain)

No arquivo `openai_whisper_audio.ts` do LangChain:

```typescript
// Antes (com bug)
const fileName =
  metadata.source === "blob" ? metadata.blobType : metadata.source;

// Depois (corrigido)
const fileName =
  metadata.source === "blob"
    ? metadata.blobType
    : path.basename(metadata.source);
```

Assim, quando `metadata.source` for um path de arquivo, só o nome do arquivo (ex: `whisper-xxx.webm`) é enviado para `toFile`.

---

## Suas opções práticas

1. **Abrir um PR no LangChain** com essa correção e aguardar o merge.
2. **Usar `patch-package`** para aplicar essa alteração automaticamente no `node_modules` após cada `pnpm install`.
3. **Usar a API da OpenAI diretamente** (sem o loader do LangChain) e controlar o nome do arquivo no `toFile`.

---

## Diagrama do fluxo

```
┌─────────────────────────────────────────────────────────────────────────┐
│ SEU CÓDIGO                                                               │
│                                                                          │
│  createTempFile() → "C:\Users\...\Temp\whisper-xxx.webm"                 │
│           │                                                              │
│           ▼                                                              │
│  new OpenAIWhisperAudio(tempFilePath)                                     │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ path completo
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ LANGCHAIN (você não controla)                                            │
│                                                                          │
│  1. Lê arquivo do path                                                   │
│  2. metadata.source = path  ← guarda path completo                      │
│  3. fileName = metadata.source  ← BUG: usa path completo                │
│  4. toFile(buffer, fileName)  ← envia path para OpenAI                  │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ multipart com filename = path
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ API OPENAI                                                               │
│                                                                          │
│  Recebe: filename="C:\Users\...\whisper-xxx.webm"                        │
│  Problema: backslashes, path longo → pode falhar no Windows              │
└─────────────────────────────────────────────────────────────────────────┘
```
