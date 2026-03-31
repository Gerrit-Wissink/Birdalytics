import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(() => {
  const isDocker = import.meta.env.VITE_DOCKER === "true";

  return {
    plugins: [react()],

    server: {
      host: true,
      port: 5173,
      strictPort: true,
      proxy: {
        "/api": {
          target: isDocker
            ? "http://backend:8000"   // Docker network
            : "http://localhost:8000", // Local dev
          changeOrigin: true,
        },
      },
    },

    build: {
      outDir: "dist",
      emptyOutDir: true,
    },
  };
});
