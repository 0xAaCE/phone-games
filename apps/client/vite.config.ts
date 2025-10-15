import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
  },
  resolve: {
    alias: {
      '@phone-games/games': path.resolve(__dirname, '../../packages/games/src/index.ts'),
      '@phone-games/notifications': path.resolve(__dirname, '../../packages/notifications/src/index.ts'),
      '@phone-games/db': path.resolve(__dirname, '../../packages/db/src/index.ts'),
    },
  },
});
