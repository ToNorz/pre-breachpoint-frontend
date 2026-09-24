import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  if (mode === 'production' && env.VITE_USE_MOCK_API === 'true') {
    throw new Error('VITE_USE_MOCK_API must be false for production builds.');
  }
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: [
        { find: '@', replacement: path.resolve(__dirname, '.') },
      ],
    },
    server: {
      host: true,
      allowedHosts: true,
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
      proxy: {
        // Proxy all backend API routes to the backend server.
        // This lets a single ngrok tunnel (frontend) handle everything.
        '/auth': 'http://localhost:8080',
        '/teams': 'http://localhost:8080',
        '/board': 'http://localhost:8080',
        '/challenges': 'http://localhost:8080',
        '/scoreboard': 'http://localhost:8080',
        '/admin': 'http://localhost:8080',
      },
    },
  };
});
