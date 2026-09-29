import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],

  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "https://exe101-backend-clubmanagement.onrender.com",
        changeOrigin: true,
        secure: true,
      },
    },
  },
});
