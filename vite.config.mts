import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';

export default defineConfig({
  plugins: [tailwindcss(), solidPlugin()],
  resolve: {
    tsconfigPaths: true,
  },
  clearScreen: false,
  build: {
    target: 'esnext',
  },
  server: {
    port: 5173,
    strictPort: false,
    host: '0.0.0.0',
    watch: {
      ignored: ['**/src-tauri/**'],
    },
  },
});
