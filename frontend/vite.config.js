import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true, // <-- importante para aceptar conexiones externas
    allowedHosts: [
      ".ngrok-free.app",
      ".ngrok-free.dev"
    ],
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true
      }
    }
  }
});
