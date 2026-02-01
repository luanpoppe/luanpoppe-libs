import { defineConfig } from "vitest/config";
import { resolve } from "path";
import { config } from "dotenv";

// Carrega o arquivo .env da raiz do pacote
config({ path: resolve(process.cwd(), ".env") });

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["tests/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "dist/",
        "**/*.config.*",
        "**/tests/**",
      ],
    },
  },
});
