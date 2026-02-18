import { AIMemory } from "../../../src/langchain/memory";
import { MemorySaver } from "@langchain/langgraph";
import { describe, it, expect, vi } from "vitest";

describe("AIMemory", () => {
  describe("getCheckpointer", () => {
    it("deve criar MemorySaver para type memory", async () => {
      const memory = new AIMemory({ type: "memory" });
      const checkpointer = await memory.getCheckpointer();
      expect(checkpointer).toBeInstanceOf(MemorySaver);
    });

    it("deve retornar a mesma instância em chamadas subsequentes", async () => {
      const memory = new AIMemory({ type: "memory" });
      const cp1 = await memory.getCheckpointer();
      const cp2 = await memory.getCheckpointer();
      expect(cp1).toBe(cp2);
    });

    it("deve criar MongoDBSaver com url quando pacotes estão instalados", async () => {
      const memory = new AIMemory({
        type: "mongodb",
        url: "mongodb://localhost:27017/test",
      });
      const checkpointer = await memory.getCheckpointer();
      expect(checkpointer).toBeDefined();
      expect(checkpointer).toHaveProperty("get");
      expect(checkpointer).toHaveProperty("put");
    });
  });

  describe("getHistory", () => {
    it("deve retornar fullHistory e messages via graph.getStateHistory", async () => {
      const memory = new AIMemory({ type: "memory" });
      const mockSnapshot1 = {
        values: { messages: [{ role: "user", content: "oi" }] },
        config: { configurable: { thread_id: "1" } },
        next: [],
        tasks: [],
        createdAt: "2024-01-01T10:00:00Z",
      };
      const mockSnapshot2 = {
        values: {
          messages: [
            { role: "user", content: "oi" },
            { role: "assistant", content: "olá" },
          ],
        },
        config: { configurable: { thread_id: "1" } },
        next: [],
        tasks: [],
        createdAt: "2024-01-01T10:01:00Z",
      };
      // getStateHistory retorna mais recente primeiro: snapshot2 (2 msgs) depois snapshot1 (1 msg)
      const mockGraph = {
        getStateHistory: vi.fn(async function* () {
          yield mockSnapshot2;
          yield mockSnapshot1;
        }),
      };
      const result = await memory.getHistory("1", mockGraph as any);
      expect(result.fullHistory).toHaveLength(2);
      expect(result.fullHistory[0]).toEqual(mockSnapshot2);
      expect(result.fullHistory[1]).toEqual(mockSnapshot1);
      expect(result.messages).toHaveLength(2);
      expect(result.messages[0]).toEqual({
        role: "human",
        createdAt: "2024-01-01T10:00:00Z",
        content: "oi",
      });
      expect(result.messages[1]).toEqual({
        role: "ai",
        createdAt: "2024-01-01T10:01:00Z",
        content: "olá",
      });
      expect(mockGraph.getStateHistory).toHaveBeenCalledWith({
        configurable: { thread_id: "1" },
      });
    });

    it("deve usar agent do setAgent quando graph não é passado", async () => {
      const memory = new AIMemory({ type: "memory" });
      const mockGraph = {
        getStateHistory: vi.fn(async function* () {
          yield {
            values: { messages: [{ role: "user", content: "teste" }] },
            createdAt: "2024-01-01T10:00:00Z",
          };
        }),
      };
      memory.setAgent(mockGraph as any);
      const result = await memory.getHistory("1");
      expect(result.messages).toHaveLength(1);
      expect(result.messages[0].content).toBe("teste");
      expect(mockGraph.getStateHistory).toHaveBeenCalledWith({
        configurable: { thread_id: "1" },
      });
    });

    it("deve usar checkpointer.list quando graph e agent não estão disponíveis", async () => {
      const memory = new AIMemory({ type: "memory" });
      const mockTuple1 = {
        checkpoint: {
          channel_values: { messages: [{ role: "user", content: "oi" }] },
          ts: "2024-01-01T10:00:00Z",
        },
        config: { configurable: { thread_id: "1" } },
        metadata: {},
      };
      const mockTuple2 = {
        checkpoint: {
          channel_values: {
            messages: [
              { role: "user", content: "oi" },
              { role: "assistant", content: "olá" },
            ],
          },
          ts: "2024-01-01T10:01:00Z",
        },
        config: { configurable: { thread_id: "1" } },
        metadata: {},
      };
      const mockList = vi.fn(async function* () {
        yield mockTuple2;
        yield mockTuple1;
      });
      vi.spyOn(memory, "getCheckpointer").mockResolvedValue({
        list: mockList,
      } as any);

      const result = await memory.getHistory("1");

      expect(result.fullHistory).toHaveLength(2);
      expect(result.fullHistory[0].values).toEqual(mockTuple2.checkpoint.channel_values);
      expect(result.fullHistory[1].values).toEqual(mockTuple1.checkpoint.channel_values);
      expect(result.messages).toHaveLength(2);
      expect(result.messages[0]).toEqual({
        role: "human",
        createdAt: "2024-01-01T10:00:00Z",
        content: "oi",
      });
      expect(result.messages[1]).toEqual({
        role: "ai",
        createdAt: "2024-01-01T10:01:00Z",
        content: "olá",
      });
      expect(mockList).toHaveBeenCalledWith({ configurable: { thread_id: "1" } });
    });
  });

  describe("getState", () => {
    it("deve retornar estado atual via graph.getState quando disponível", async () => {
      const memory = new AIMemory({ type: "memory" });
      const mockState = {
        values: { messages: [{ role: "user", content: "oi" }] },
        config: { configurable: { thread_id: "1" } },
        next: [],
        tasks: [],
      };
      const mockGraph = {
        getState: vi.fn().mockResolvedValue(mockState),
        getStateHistory: vi.fn(async function* () {
          yield mockState;
        }),
      };
      const state = await memory.getState("1", mockGraph as any);
      expect(state).toEqual(mockState);
      expect(mockGraph.getState).toHaveBeenCalledWith({
        configurable: { thread_id: "1" },
      });
    });

    it("deve usar getStateHistory quando getState não existe", async () => {
      const memory = new AIMemory({ type: "memory" });
      const mockState = {
        values: { messages: [] },
        config: { configurable: { thread_id: "1" } },
        next: [],
        tasks: [],
      };
      const mockGraph = {
        getStateHistory: vi.fn(async function* () {
          yield mockState;
        }),
      };
      const state = await memory.getState("1", mockGraph as any);
      expect(state).toEqual(mockState);
    });

    it("deve usar checkpointer quando graph não está disponível", async () => {
      const memory = new AIMemory({ type: "memory" });
      const mockTuple = {
        checkpoint: {
          channel_values: { messages: [{ role: "user", content: "oi" }] },
          ts: "2024-01-01T10:00:00Z",
        },
        config: { configurable: { thread_id: "1" } },
        metadata: {},
      };
      const mockList = vi.fn(async function* () {
        yield mockTuple;
      });
      vi.spyOn(memory, "getCheckpointer").mockResolvedValue({
        list: mockList,
      } as any);

      const state = await memory.getState("1");

      expect(state).not.toBeNull();
      expect(state?.values).toEqual({ messages: [{ role: "user", content: "oi" }] });
      expect(mockList).toHaveBeenCalledWith({ configurable: { thread_id: "1" } });
    });
  });
});
