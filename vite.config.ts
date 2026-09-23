import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  if (mode === 'production' && env.VITE_USE_MOCK_API === 'true') {
    throw new Error('VITE_USE_MOCK_API must be false for production builds.');
  }
  if (mode === 'production') {
    const apiBase = env.VITE_API_BASE_URL?.trim() ?? '';
    const relativeBase = apiBase.startsWith('/') && !apiBase.startsWith('//');
    let secureRemoteBase = false;
    try {
      const parsed = new URL(apiBase);
      secureRemoteBase = parsed.protocol === 'https:' && !parsed.username && !parsed.password;
    } catch {
      /* Relative API paths are valid when served through the same origin. */
    }
    if (!relativeBase && !secureRemoteBase) {
      throw new Error('Production builds require VITE_API_BASE_URL to be a relative path or HTTPS URL.');
    }
  }

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: [
        {
          find: '@mock-data',
          replacement: path.resolve(
            __dirname,
            mode === 'production' ? 'src/services/mockData.production.ts' : 'src/services/mockData.ts',
          ),
        },
        { find: '@', replacement: path.resolve(__dirname, '.') },
      ],
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
