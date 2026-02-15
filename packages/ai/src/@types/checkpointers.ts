import type { StateSnapshot } from "@langchain/langgraph";

/**
 * Interface mínima para um grafo compilado com checkpointer.
 * Usado para acessar o histórico de conversas via getStateHistory.
 *
 * @see https://docs.langchain.com/oss/javascript/langgraph/persistence#get-state-history
 * @see https://docs.langchain.com/oss/javascript/langgraph/add-memory#manage-checkpoints
 */
export interface GraphWithStateHistory {
  /**
   * Retorna o histórico completo de checkpoints de uma thread.
   * Ordenado cronologicamente (mais recente primeiro).
   */
  getStateHistory(config: {
    configurable: { thread_id: string; checkpoint_id?: string };
  }): AsyncIterable<StateSnapshot>;

  /**
   * Retorna o estado atual (último checkpoint) da thread.
   */
  getState?(config: {
    configurable: { thread_id: string; checkpoint_id?: string };
  }): Promise<StateSnapshot>;
}

/**
 * Configuração para checkpointer em memória (desenvolvimento/testes).
 */
export type MemoryCheckpointerConfig = {
  type: "memory";
};

/**
 * Configuração para checkpointer SQLite.
 * Use ":memory:" para testes ou path para arquivo persistente.
 */
export type SqliteCheckpointerConfig = {
  type: "sqlite";
  connectionString: string;
};

/**
 * Configuração para checkpointer Postgres.
 */
export type PostgresCheckpointerConfig = {
  type: "postgres";
  connectionString: string;
};

/**
 * Configuração para checkpointer Redis.
 * Requer Redis 8+ ou Redis Stack (RedisJSON, RediSearch).
 */
export type RedisCheckpointerConfig = {
  type: "redis";
  url: string;
  options?: {
    defaultTTL?: number;
    refreshOnRead?: boolean;
  };
};

/**
 * Configuração para checkpointer MongoDB com cliente existente.
 */
export type MongoDBCheckpointerConfigWithClient = {
  type: "mongodb";
  client: { close?: () => Promise<void> };
};

/**
 * Configuração para checkpointer MongoDB com URL.
 */
export type MongoDBCheckpointerConfigWithUrl = {
  type: "mongodb";
  url: string;
};

export type MongoDBCheckpointerConfig =
  | MongoDBCheckpointerConfigWithClient
  | MongoDBCheckpointerConfigWithUrl;

/**
 * Configuração para persistência de histórico de conversas.
 * Permite escolher o backend de armazenamento.
 */
export type MemoryConfig =
  | MemoryCheckpointerConfig
  | SqliteCheckpointerConfig
  | PostgresCheckpointerConfig
  | RedisCheckpointerConfig
  | MongoDBCheckpointerConfig;

/**
 * Tipo de mensagem no histórico (Human, AI ou Tool).
 */
export type MessageRole = "human" | "ai" | "tool";

/**
 * Item de mensagem extraído do histórico, com role, horário e conteúdo.
 */
export type HistoryMessageItem = {
  role: MessageRole;
  createdAt: string;
  content: string;
};

/**
 * Retorno do método getHistory com histórico completo e lista de mensagens.
 */
export type GetHistoryResult = {
  /** Histórico completo de checkpoints (mais recente primeiro). */
  fullHistory: StateSnapshot[];
  /** Lista de mensagens em ordem cronológica, com role, horário e conteúdo. */
  messages: HistoryMessageItem[];
};
