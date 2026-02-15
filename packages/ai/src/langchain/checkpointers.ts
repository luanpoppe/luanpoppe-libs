import {
  BaseCheckpointSaver,
  MemorySaver,
  type StateSnapshot,
} from "@langchain/langgraph";
import type {
  GetHistoryResult,
  GraphWithStateHistory,
  HistoryMessageItem,
  MemoryConfig,
  MessageRole,
} from "../@types/checkpointers";

export type { BaseCheckpointSaver };
export type {
  MemoryConfig,
  MemoryCheckpointerConfig,
  SqliteCheckpointerConfig,
  PostgresCheckpointerConfig,
  RedisCheckpointerConfig,
  MongoDBCheckpointerConfig,
  GraphWithStateHistory,
  MessageRole,
  HistoryMessageItem,
  GetHistoryResult,
} from "../@types/checkpointers";

/**
 * Classe para gerenciar memória e checkpointers de conversas LangGraph.
 *
 * @example
 * // Memória (desenvolvimento)
 * const memory = new AIMemory({ type: "memory" });
 * const checkpointer = await memory.getCheckpointer();
 *
 * @example
 * // SQLite
 * const memory = new AIMemory({ type: "sqlite", connectionString: "./data.db" });
 *
 * @example
 * // Acessar histórico de conversa
 * const { agent } = await ai.getRawAgent({ ... });
 * const history = await memory.getHistory("thread-1", agent);
 * const messages = history[0]?.values?.messages ?? [];
 */
export class AIMemory {
  private checkpointer: BaseCheckpointSaver | undefined;
  private checkpointerPromise: Promise<BaseCheckpointSaver> | undefined;
  private agent: GraphWithStateHistory | undefined;

  constructor(
    private config: MemoryConfig,
    agent?: GraphWithStateHistory
  ) {
    this.agent = agent;
  }

  /**
   * Define o agent/grafo para uso em getHistory quando graph não é passado.
   * Chamado automaticamente por AI.getRawAgent() quando a instância está vinculada ao AI.
   */
  setAgent(agent: GraphWithStateHistory): void {
    this.agent = agent;
  }

  /**
   * Cria ou retorna a instância de checkpointer baseada na configuração.
   *
   * @example
   * const cp = await memory.getCheckpointer();
   * const graph = workflow.compile({ checkpointer: cp });
   */
  async getCheckpointer(): Promise<BaseCheckpointSaver> {
    if (this.checkpointer) return this.checkpointer;
    if (!this.checkpointerPromise) {
      this.checkpointerPromise = this.createCheckpointer();
    }
    this.checkpointer = await this.checkpointerPromise;
    return this.checkpointer;
  }

  /**
   * Retorna o histórico de checkpoints e lista de mensagens de uma thread.
   *
   * @param threadId - ID da thread/conversa
   * @param graph - Opcional. Grafo compilado com checkpointer. Se não passado, usa o agent
   *                definido no construtor ou via setAgent (ex: agent de ai.getRawAgent).
   * @returns Objeto com fullHistory (checkpoints) e messages (lista com role, createdAt, content)
   *
   * @example
   * // Com ai.memory (agent definido automaticamente em call/getRawAgent)
   * await ai.call({ messages: [...], threadId: "1" });
   * const { fullHistory, messages } = await ai.memory.getHistory("1");
   *
   * @example
   * // Passando graph explicitamente
   * const { fullHistory, messages } = await memory.getHistory("1", agent);
   *
   * @see https://docs.langchain.com/oss/javascript/langgraph/persistence#get-state-history
   * @see https://docs.langchain.com/oss/javascript/langgraph/add-memory#manage-checkpoints
   */
  async getHistory(
    threadId: string,
    graph?: GraphWithStateHistory
  ): Promise<GetHistoryResult> {
    const graphToUse = graph ?? this.agent;
    if (!graphToUse) {
      throw new Error(
        "É necessário passar graph em getHistory ou definir o agent no construtor/setAgent do AIMemory."
      );
    }
    const config = { configurable: { thread_id: threadId } };
    const fullHistory: StateSnapshot[] = [];
    for await (const snapshot of graphToUse.getStateHistory(config)) {
      fullHistory.push(snapshot);
    }

    const messages = this.extractMessagesFromHistory(fullHistory);
    return { fullHistory, messages };
  }

  /**
   * Extrai lista de mensagens com role, createdAt e content a partir do histórico.
   * Percorre os checkpoints do mais antigo ao mais recente para atribuir createdAt correto.
   */
  private extractMessagesFromHistory(
    history: StateSnapshot[]
  ): HistoryMessageItem[] {
    const result: HistoryMessageItem[] = [];
    let previousMessageCount = 0;

    // history[0] = mais recente, history[length-1] = mais antigo
    // Cada snapshot acumula mensagens; só adicionamos as novas
    for (let i = history.length - 1; i >= 0; i--) {
      const snapshot = history[i]!;
      const snapshotMessages = (snapshot.values?.messages ?? []) as Array<{
        id?: string;
        getType?: () => string;
        _getType?: () => string;
        content?: string | Array<unknown>;
        constructor?: { name?: string };
        role?: string;
      }>;
      const createdAt =
        (snapshot as { createdAt?: string }).createdAt ??
        new Date().toISOString();

      for (let j = previousMessageCount; j < snapshotMessages.length; j++) {
        const msg = snapshotMessages[j];
        if (!msg) continue;
        const role = this.getMessageRole(msg);
        if (role === "system") continue;

        result.push({
          role: role as MessageRole,
          createdAt,
          content: this.extractContent(msg),
        });
      }
      previousMessageCount = snapshotMessages.length;
    }

    return result;
  }

  private getMessageRole(msg: {
    getType?: () => string;
    _getType?: () => string;
    constructor?: { name?: string };
    role?: string;
  }): "human" | "ai" | "tool" | "system" {
    const role = (msg as { role?: string }).role?.toLowerCase();
    if (role === "human" || role === "user") return "human";
    if (role === "ai" || role === "assistant") return "ai";
    if (role === "tool") return "tool";

    const type =
      msg.getType?.() ??
      msg._getType?.() ??
      msg.constructor?.name?.toLowerCase() ?? "";
    const normalized = type.toLowerCase().replace("message", "").trim();
    if (normalized === "human" || normalized === "user") return "human";
    if (normalized === "ai" || normalized === "assistant") return "ai";
    if (normalized === "tool") return "tool";
    return "system";
  }

  private extractContent(msg: {
    content?: string | Array<unknown>;
  }): string {
    const c = msg.content;
    if (typeof c === "string") return c;
    if (Array.isArray(c)) {
      return c
        .map((block: unknown) =>
          typeof block === "string" ? block : (block as { text?: string })?.text ?? ""
        )
        .filter(Boolean)
        .join("\n");
    }
    return "";
  }

  /**
   * Retorna o estado atual (último checkpoint) de uma thread.
   *
   * @param threadId - ID da thread/conversa
   * @param graph - Grafo compilado com checkpointer
   * @param checkpointId - Opcional: ID de um checkpoint específico
   *
   * @example
   * const state = await memory.getState("1", agent);
   * const messages = state?.values?.messages ?? [];
   *
   * @see https://docs.langchain.com/oss/javascript/langgraph/persistence#get-state
   */
  async getState(
    threadId: string,
    graph?: GraphWithStateHistory,
    checkpointId?: string
  ): Promise<StateSnapshot | null> {
    const graphToUse = graph ?? this.agent;
    if (!graphToUse) {
      throw new Error(
        "É necessário passar graph em getState ou definir o agent no construtor/setAgent do AIMemory."
      );
    }
    if (!graphToUse.getState) {
      const { fullHistory } = await this.getHistory(threadId, graphToUse);
      return fullHistory[0] ?? null;
    }
    const config = {
      configurable: { thread_id: threadId, ...(checkpointId && { checkpoint_id: checkpointId }) },
    };
    return (await graphToUse.getState(config)) ?? null;
  }

  private async createCheckpointer(): Promise<BaseCheckpointSaver> {
    if (this.checkpointer) return this.checkpointer;

    switch (this.config.type) {
      case "memory": {
        return new MemorySaver();
      }

      case "sqlite": {
        try {
          const { SqliteSaver } = await import(
            "@langchain/langgraph-checkpoint-sqlite"
          );
          return SqliteSaver.fromConnString(
            this.config.connectionString
          ) as unknown as BaseCheckpointSaver;
        } catch (err) {
          throw new Error(
            'Checkpointer SQLite requer o pacote "@langchain/langgraph-checkpoint-sqlite". ' +
              "Instale com: pnpm add @langchain/langgraph-checkpoint-sqlite",
            { cause: err }
          );
        }
      }

      case "postgres": {
        try {
          const { PostgresSaver } = await import(
            "@langchain/langgraph-checkpoint-postgres"
          );
          const checkpointer = PostgresSaver.fromConnString(
            this.config.connectionString
          );
          await checkpointer.setup();
          return checkpointer as unknown as BaseCheckpointSaver;
        } catch (err) {
          throw new Error(
            'Checkpointer Postgres requer o pacote "@langchain/langgraph-checkpoint-postgres". ' +
              "Instale com: pnpm add @langchain/langgraph-checkpoint-postgres",
            { cause: err }
          );
        }
      }

      case "redis": {
        try {
          const { RedisSaver } = await import(
            "@langchain/langgraph-checkpoint-redis"
          );
          return (await RedisSaver.fromUrl(
            this.config.url,
            this.config.options ?? {}
          )) as unknown as BaseCheckpointSaver;
        } catch (err) {
          throw new Error(
            'Checkpointer Redis requer o pacote "@langchain/langgraph-checkpoint-redis". ' +
              "Instale com: pnpm add @langchain/langgraph-checkpoint-redis",
            { cause: err }
          );
        }
      }

      case "mongodb": {
        try {
          const { MongoDBSaver } = await import(
            "@langchain/langgraph-checkpoint-mongodb"
          );
          if ("client" in this.config) {
            return new MongoDBSaver({
              client: this.config.client as any,
            }) as unknown as BaseCheckpointSaver;
          }
          const { MongoClient } = await import("mongodb");
          const client = new MongoClient(this.config.url) as any;
          return new MongoDBSaver({ client }) as unknown as BaseCheckpointSaver;
        } catch (err) {
          throw new Error(
            'Checkpointer MongoDB requer os pacotes "@langchain/langgraph-checkpoint-mongodb" e "mongodb". ' +
              "Instale com: pnpm add @langchain/langgraph-checkpoint-mongodb mongodb",
            { cause: err }
          );
        }
      }

      default: {
        const _exhaustive: never = this.config;
        throw new Error(
          `Tipo de checkpointer não suportado: ${(_exhaustive as any)?.type}`
        );
      }
    }
  }
}

