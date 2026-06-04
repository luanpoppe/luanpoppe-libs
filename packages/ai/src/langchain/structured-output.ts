import type { BaseMessage } from "langchain";
import z from "zod";

/** Modelos DeepSeek (direto ou via OpenRouter) não aceitam `json_schema`; apenas `json_object`. */
export function isDeepSeekJsonObjectOnlyModel(aiModel: string): boolean {
  return (
    aiModel.startsWith("openrouter/deepseek/") || aiModel.startsWith("deepseek/")
  );
}

export function buildJsonObjectSystemAppend(schema: z.ZodSchema): string {
  const jsonSchema = z.toJSONSchema(schema);
  return [
    "",
    "IMPORTANTE: Responda somente com um objeto JSON válido (sem markdown, sem texto extra).",
    "O JSON deve seguir este schema:",
    JSON.stringify(jsonSchema, null, 2),
  ].join("\n");
}

export function mergeSystemPromptWithJsonSchema(
  systemPrompt: string | undefined,
  schema: z.ZodSchema,
): string {
  const base = systemPrompt?.trim() ?? "";
  const append = buildJsonObjectSystemAppend(schema);
  return base ? `${base}\n${append}` : append.trim();
}

function contentToString(content: unknown): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === "string") return part;
        if (part && typeof part === "object" && "text" in part) {
          return String((part as { text?: unknown }).text ?? "");
        }
        return "";
      })
      .join("");
  }
  return "";
}

/** Extrai e faz parse de JSON na última mensagem do assistente (suporta fences ```json). */
export function parseJsonFromAssistantMessages(
  messages: BaseMessage[],
): unknown {
  const last = messages.at(-1);
  if (!last) {
    throw new Error(
      "[@luanpoppe/ai] Nenhuma mensagem do assistente para extrair JSON.",
    );
  }

  const raw = contentToString((last as { content?: unknown }).content).trim();
  if (!raw) {
    throw new Error("[@luanpoppe/ai] Resposta vazia ao extrair JSON estruturado.");
  }

  const fenced = raw.match(/^```(?:json)?\s*([\s\S]*?)```$/i);
  const jsonText = (fenced?.[1] ?? raw).trim();

  try {
    return JSON.parse(jsonText);
  } catch {
    const start = jsonText.indexOf("{");
    const end = jsonText.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(jsonText.slice(start, end + 1));
    }
    throw new Error(
      "[@luanpoppe/ai] Não foi possível fazer parse do JSON retornado pelo modelo.",
    );
  }
}
