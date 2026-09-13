import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Mirrors tsconfig.json's "@/*" -> "./*" — Vitest doesn't read tsconfig `paths`
// on its own, and app/api/share/route.test.ts is the first test to import a
// file that itself uses `@/` imports (existing lib/compute tests never needed this).
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL(".", import.meta.url)),
    },
  },
});
