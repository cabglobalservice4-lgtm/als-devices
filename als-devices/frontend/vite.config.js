import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// En développement, /api est redirigé vers Laravel (php artisan serve)
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: { "/api": "http://127.0.0.1:8000" },
  },
});
