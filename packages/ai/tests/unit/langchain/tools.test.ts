import { AITools, CreateToolParams } from "../../../src/langchain/tools";
import { tool } from "langchain";
import z from "zod";

// Mock do langchain
vi.mock("langchain", () => ({
  tool: vi.fn(),
}));

describe("AITools", () => {
  let aiTools: AITools;

  beforeEach(() => {
    vi.clearAllMocks();
    aiTools = new AITools();
  });

  describe("createTool", () => {
    it("deve criar uma ferramenta com todos os parâmetros fornecidos", () => {
      const schema = z.object({ query: z.string() });
      const toolFunction = async (input: z.infer<typeof schema>) => {
        return `Resultado para: ${input.query}`;
      };

      const params: CreateToolParams<typeof schema> = {
        toolFunction,
        name: "search_tool",
        description: "Uma ferramenta de busca",
        schema,
      };

      const mockTool = {} as any;
      vi.mocked(tool).mockReturnValue(mockTool);

      const result = aiTools.createTool(params);

      expect(tool).toHaveBeenCalledWith(toolFunction, {
        name: "search_tool",
        description: "Uma ferramenta de busca",
        schema: params.schema,
      });
      expect(result).toBe(mockTool);
    });

    it("deve criar uma ferramenta com schema complexo", () => {
      const schema = z.object({
        name: z.string(),
        age: z.number(),
        email: z.string().email(),
      });
      const toolFunction = async (input: z.infer<typeof schema>) => {
        return `Usuário: ${input.name}, ${input.age} anos, ${input.email}`;
      };

      const params: CreateToolParams<typeof schema> = {
        toolFunction,
        name: "user_tool",
        description: "Ferramenta para processar usuários",
        schema,
      };

      const mockTool = {} as any;
      vi.mocked(tool).mockReturnValue(mockTool);

      const result = aiTools.createTool(params);

      expect(tool).toHaveBeenCalledWith(toolFunction, {
        name: "user_tool",
        description: "Ferramenta para processar usuários",
        schema: params.schema,
      });
      expect(result).toBe(mockTool);
    });

    it("deve criar uma ferramenta com schema simples", () => {
      const schema = z.object({});
      const toolFunction = async () => {
        return "Resultado simples";
      };

      const params: CreateToolParams<typeof schema> = {
        toolFunction,
        name: "simple_tool",
        description: "Ferramenta simples",
        schema,
      };

      const mockTool = {} as any;
      vi.mocked(tool).mockReturnValue(mockTool);

      const result = aiTools.createTool(params);

      expect(tool).toHaveBeenCalledWith(toolFunction, {
        name: "simple_tool",
        description: "Ferramenta simples",
        schema: params.schema,
      });
      expect(result).toBe(mockTool);
    });

    it("deve criar múltiplas ferramentas independentes", () => {
      const schema1 = z.object({ x: z.number() });
      const schema2 = z.object({ y: z.string() });

      const toolFunction1 = async (input: z.infer<typeof schema1>) =>
        input.x * 2;
      const toolFunction2 = async (input: z.infer<typeof schema2>) =>
        input.y.toUpperCase();

      const params1: CreateToolParams<typeof schema1> = {
        toolFunction: toolFunction1,
        name: "multiply",
        description: "Multiplica por 2",
        schema: schema1,
      };

      const params2: CreateToolParams<typeof schema2> = {
        toolFunction: toolFunction2,
        name: "uppercase",
        description: "Converte para maiúsculas",
        schema: schema2,
      };

      const mockTool1 = {} as any;
      const mockTool2 = {} as any;
      vi.mocked(tool)
        .mockReturnValueOnce(mockTool1)
        .mockReturnValueOnce(mockTool2);

      const result1 = aiTools.createTool(params1);
      const result2 = aiTools.createTool(params2);

      expect(tool).toHaveBeenCalledTimes(2);
      expect(result1).toBe(mockTool1);
      expect(result2).toBe(mockTool2);
    });
  });
});
