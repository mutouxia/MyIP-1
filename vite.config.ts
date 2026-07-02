import { resolve } from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  root: resolve(__dirname, "src"),
  base: "./",
  build: {
    outDir: resolve(__dirname, "dist"),
    emptyOutDir: true,
    target: "es2018",
    rollupOptions: {
      input: {
        main: resolve(__dirname, "src/index.html"),
        simple: resolve(__dirname, "src/simple/index.html"),
      },
    },
  },
});
