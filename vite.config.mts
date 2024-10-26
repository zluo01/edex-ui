import { defineConfig } from 'vite';
import eslint from 'vite-plugin-eslint';
import solidPlugin from 'vite-plugin-solid';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [solidPlugin(), tsconfigPaths(), eslint()],
  clearScreen: false,
  build: {
    target: 'esnext',
  },
  server: {
    port: 1874,
    strictPort: true,
    watch: {
      ignored: ['**/src-tauri/**'],
    },
  },
});
