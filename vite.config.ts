import tailwindcss from '@tailwindcss/vite';
import ReactPlugin from '@vitejs/plugin-react';
import { URL, fileURLToPath } from 'node:url';
import path from 'path';
import { defineConfig } from 'vite';
import RubyPlugin from 'vite-plugin-ruby';

export default defineConfig({
  plugins: [
    ReactPlugin({
      jsxRuntime: 'automatic',
    }),
    RubyPlugin(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@cctv/core': path.resolve(fileURLToPath(new URL('.', import.meta.url)), 'app/frontend/Core'),
      '@cctv/components': path.resolve(
        fileURLToPath(new URL('.', import.meta.url)),
        'app/frontend/Components',
      ),
      '@cctv/experiences': path.resolve(
        fileURLToPath(new URL('.', import.meta.url)),
        'app/frontend/Experiences',
      ),
      '@cctv/hooks': path.resolve(
        fileURLToPath(new URL('.', import.meta.url)),
        'app/frontend/Hooks',
      ),
      '@cctv/pages': path.resolve(
        fileURLToPath(new URL('.', import.meta.url)),
        'app/frontend/Pages',
      ),
      '@cctv/utils': path.resolve(
        fileURLToPath(new URL('.', import.meta.url)),
        'app/frontend/utils',
      ),
      '@cctv/types': path.resolve(
        fileURLToPath(new URL('.', import.meta.url)),
        'app/frontend/types',
      ),
      '@cctv/contexts': path.resolve(
        fileURLToPath(new URL('.', import.meta.url)),
        'app/frontend/Contexts',
      ),
      '@cctv/RouteRules': path.resolve(
        fileURLToPath(new URL('.', import.meta.url)),
        'app/frontend/RouteRules',
      ),
    },
  },
});
