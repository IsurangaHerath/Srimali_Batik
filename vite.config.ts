import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: 'src/public',
  base: '/',
  publicDir: resolve(__dirname, 'src/public/assets'),
  build: {
    outDir: resolve(__dirname, 'public/dist'),
    emptyOutDir: true,
    sourcemap: false,
    minify: 'esbuild',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'src/public/index.html'),
        admin: resolve(__dirname, 'src/public/admin.html'),
      },
      output: {
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
  },
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': 'http://localhost:3000',
      '/ws': {
        target: 'ws://localhost:3000',
        ws: true,
      },
    },
  },
  css: {
    devSourcemap: true,
  },
});
