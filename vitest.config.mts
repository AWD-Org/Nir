import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL(".", import.meta.url)) } },
  test: {
    environment: "node",
    testTimeout: 20000,
    // Evita que firebase/app y firebase/firestore se resuelvan en copias distintas (ESM/CJS).

  },
});
