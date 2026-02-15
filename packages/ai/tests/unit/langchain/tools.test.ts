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
      const toolFunction = async (input: { query: string }) => {
        return `Resultado para: ${input.query}`;
      };

      const params: CreateToolParams = {
        toolFunction,
        name: "search_tool",
        description: "Uma ferramenta de busca",
        schema: z.object({
          query: z.string(),
        }),
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
      const toolFunction = async (input: {
        name: string;
        age: number;
        email: string;
      }) => {
        return `Usuário: ${input.name}, ${input.age} anos, ${input.email}`;
      };

      const params: CreateToolParams = {
        toolFunction,
        name: "user_tool",
        description: "Ferramenta para processar usuários",
        schema: z.object({
          name: z.string(),
          age: z.number(),
          email: z.string().email(),
        }),
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
      const toolFunction = async () => {
        return "Resultado simples";
      };

      const params: CreateToolParams = {
        toolFunction,
        name: "simple_tool",
        description: "Ferramenta simples",
        schema: z.object({}),
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
      const toolFunction1 = async (input: { x: number }) => input.x * 2;
      const toolFunction2 = async (input: { y: string }) =>
        input.y.toUpperCase();

      const params1: CreateToolParams = {
        toolFunction: toolFunction1,
        name: "multiply",
        description: "Multiplica por 2",
        schema: z.object({ x: z.number() }),
      };

      const params2: CreateToolParams = {
        toolFunction: toolFunction2,
        name: "uppercase",
        description: "Converte para maiúsculas",
        schema: z.object({ y: z.string() }),
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
