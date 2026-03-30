import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  // Deployed under https://derajyojith.dev/Ledgr/
  base: "/Ledgr/",
  plugins: [react(), tailwindcss()],
  build: {
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks: {
          motion: ["framer-motion"],
          charts: ["recharts"],
        },
      },
    },
  },
});
