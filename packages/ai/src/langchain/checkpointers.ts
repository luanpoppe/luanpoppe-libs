import { BaseCheckpointSaver, MemorySaver } from "@langchain/langgraph";

export type { BaseCheckpointSaver };

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
 * Cria uma instância de checkpointer baseada na configuração fornecida.
 *
 * @example
 * // Memória (desenvolvimento)
 * const cp = await createCheckpointer({ type: "memory" });
 *
 * @example
 * // SQLite
 * const cp = await createCheckpointer({ type: "sqlite", connectionString: "./data.db" });
 *
 * @example
 * // Postgres
 * const cp = await createCheckpointer({
 *   type: "postgres",
 *   connectionString: process.env.DATABASE_URL!,
 * });
 *
 * @example
 * // Redis
 * const cp = await createCheckpointer({ type: "redis", url: "redis://localhost:6379" });
 *
 * @example
 * // MongoDB
 * const cp = await createCheckpointer({ type: "mongodb", url: process.env.MONGODB_URL! });
 */
export async function createCheckpointer(
  config: MemoryConfig
): Promise<BaseCheckpointSaver> {
  switch (config.type) {
    case "memory": {
      return new MemorySaver();
    }

    case "sqlite": {
      try {
        const { SqliteSaver } = await import(
          "@langchain/langgraph-checkpoint-sqlite"
        );
        return SqliteSaver.fromConnString(config.connectionString) as unknown as BaseCheckpointSaver;
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
        const checkpointer = PostgresSaver.fromConnString(config.connectionString);
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
        return (await RedisSaver.fromUrl(config.url, config.options ?? {})) as unknown as BaseCheckpointSaver;
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
        if ("client" in config) {
          return new MongoDBSaver({ client: config.client as any }) as unknown as BaseCheckpointSaver;
        }
        const { MongoClient } = await import("mongodb");
        const client = new MongoClient(config.url) as any;
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
      const _exhaustive: never = config;
      throw new Error(`Tipo de checkpointer não suportado: ${(_exhaustive as any)?.type}`);
    }
  }
}
