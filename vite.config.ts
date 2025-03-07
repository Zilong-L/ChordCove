import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@components": "/src/components",
      "@types": "/src/types",
      "@stores": "/src/stores",
      "@utils": "/src/utils",
    },
  },
  
})
