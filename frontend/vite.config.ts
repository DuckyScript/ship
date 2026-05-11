import devServer from "@hono/vite-dev-server"
import path from "path"
const __dirname = import.meta.dirname
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    // api/boot.ts lives at the repository root; when this config is inside
    // `frontend/` we need to point the entry at the relative path up one level.
    devServer({ entry: "../backend/boot.ts", exclude: [/^\/(?!api\/).*$/] }),
    react()],
  server: {
    port: 3000,
  },
  resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
        // contracts and db live in backend; resolve to parent directory
        "@contracts": path.resolve(__dirname, "../backend/contracts"),
        "@db": path.resolve(__dirname, "../backend/db"),
        "db": path.resolve(__dirname, "../backend/db"),
      },
  },
  // .env and other repo-level env files live in the project root
  envDir: path.resolve(__dirname, ".."),
  build: {
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true,
  },
});
