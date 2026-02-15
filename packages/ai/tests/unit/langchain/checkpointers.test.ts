import { createCheckpointer } from "../../../src/langchain/checkpointers";
import { MemorySaver } from "@langchain/langgraph";
import { describe, it, expect } from "vitest";

describe("createCheckpointer", () => {
  describe("memory", () => {
    it("deve criar MemorySaver para type memory", async () => {
      const checkpointer = await createCheckpointer({ type: "memory" });
      expect(checkpointer).toBeInstanceOf(MemorySaver);
    });
  });

  describe("mongodb", () => {
    it("deve criar MongoDBSaver com url quando pacotes estão instalados", async () => {
      const checkpointer = await createCheckpointer({
        type: "mongodb",
        url: "mongodb://localhost:27017/test",
      });
      expect(checkpointer).toBeDefined();
      expect(checkpointer).toHaveProperty("get");
      expect(checkpointer).toHaveProperty("put");
    });
  });
});
