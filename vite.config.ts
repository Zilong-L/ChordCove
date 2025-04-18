import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import checker from "vite-plugin-checker";
// @ts-ignore
import eslint from 'vite-plugin-eslint'
// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    eslint(),
    checker({
      typescript: {
        tsconfigPath: "tsconfig.app.json",
      },
    }),
  ],
  resolve: {
    alias: {
      "@components": "/src/components",
      "@pages": "/src/pages",
      "@stores": "/src/stores",
      "@assets": "/src/assets",
      "@utils": "/src/utils",
      "@hooks": "/src/hooks",
      "@lib": "/src/lib",
      "#types": "/src/types",
    },
  },
});
