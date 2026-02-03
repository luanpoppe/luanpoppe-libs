import { tool } from "langchain";
import z from "zod";

export type CreateToolParams = {
  toolFunction: Parameters<typeof tool>[0];
  name: string;
  description: string;
  schema: z.ZodSchema;
};

export class AITools {
  createTool(params: CreateToolParams) {
    const { toolFunction } = params;
    const { name, description, schema } = params;

    return tool(toolFunction, {
      name,
      description,
      schema,
    });
  }
}
