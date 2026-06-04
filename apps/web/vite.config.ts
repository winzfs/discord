import { resolve } from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  publicDir: resolve(__dirname, "../../public"),
  server: {
    port: 5173,
  },
});
