import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  base: "./",
  build: { target: "es2022" },
  server: {
    host: "0.0.0.0",
    port: 4174,
    strictPort: true,
    allowedHosts: ["localhost", "127.0.0.1", "host.docker.internal"],
    watch: { usePolling: true, interval: 350 },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test-setup.ts"],
    include: ["src/**/__tests__/*.{test,spec}.{ts,tsx}"],
    restoreMocks: true,
    clearMocks: true,
  },
});
