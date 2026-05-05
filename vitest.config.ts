import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
      "server-only": path.resolve(__dirname, "tests/server-only-stub.ts"),
    },
  },
  test: {
    environment: "node",
    include: ["**/*.test.ts"],
    exclude: ["node_modules/**", ".next/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "json-summary"],
      include: [
        "lib/**/*.ts",
        "services/**/*.ts",
      ],
      exclude: [
        "**/*.test.ts",
        "**/index.ts",
        "lib/prisma.ts",
        "lib/supabase/**",
        "services/auth/profile-repository.ts",
      ],
    },
  },
});
