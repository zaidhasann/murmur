import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { crx } from '@crxjs/vite-plugin';
import manifest from './manifest.config';
import path from 'path';

export default defineConfig({
  plugins: [react(), crx({ manifest })],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '../'),
      '@shared': path.resolve(__dirname, '../lib'),
      '@components': path.resolve(__dirname, '../components'),
      '@store': path.resolve(__dirname, '../store'),
      '@styles': path.resolve(__dirname, '../styles'),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
