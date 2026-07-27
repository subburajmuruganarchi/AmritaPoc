import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 8085,
  },
  preview: {
    port: 8085,
  },
  optimizeDeps: {
    include: ['epubjs', 'jszip', 'pdfjs-dist'],
  },
  build: {
    target: 'es2022',
  },
});
