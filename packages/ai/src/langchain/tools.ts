import { tool } from "langchain";
import z from "zod";

/**
 * Parâmetros de `AITools.createTool`. Genérico no `schema` para que
 * `toolFunction` receba o tipo inferido (`z.infer<TSchema>`) em vez de `unknown`.
 */
export type CreateToolParams<TSchema extends z.ZodSchema = z.ZodSchema> = {
  toolFunction: (input: z.infer<TSchema>) => unknown;
  name: string;
  description: string;
  schema: TSchema;
};

export class AITools {
  createTool<TSchema extends z.ZodSchema>(
    params: CreateToolParams<TSchema>,
  ): ReturnType<typeof tool> {
    const { toolFunction } = params;
    const { name, description, schema } = params;

    // `tool` tem generics internos sensíveis ao schema; o cast mantém a assinatura
    // pública simples sem arrastar tipos não-portáveis do LangChain para o .d.ts.
    return tool(toolFunction as Parameters<typeof tool>[0], {
      name,
      description,
      schema,
    }) as unknown as ReturnType<typeof tool>;
  }
}
