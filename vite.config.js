import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: process.env.GITHUB_ACTIONS === "true"
    ? "/SMART-CAMPUS-RESOURCE-AND-MANAGEMENT-SYSTEM/"
    : "/",
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
    },
  },
  build: {
    manifest: true,
    rollupOptions: {
      input: {
        app: "main.jsx",
        index: "index.html",
      },
    },
  },
});
