import { defineConfig } from 'vite';

export default defineConfig({
  root: 'web',
  base: '/',
  build: {
    outDir: '../dist',
    emptyOutDir: true
  },
  server: {
    port: 5173,
    proxy: {
      '/api/backend': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  }
});
