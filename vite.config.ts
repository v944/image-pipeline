import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes("node_modules/react-dom") || id.includes("node_modules/react/") || id.includes("node_modules/react-router")) {
            return "react-vendor";
          }
          if (id.includes("node_modules/@xyflow")) {
            return "flow-vendor";
          }
          if (id.includes("node_modules/framer-motion") || id.includes("node_modules/lucide")) {
            return "ui-vendor";
          }
        },
      },
    },
  },
});
