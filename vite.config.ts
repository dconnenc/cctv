import { defineConfig } from 'vite'
import ReactPlugin from "@vitejs/plugin-react"
import RubyPlugin from 'vite-plugin-ruby'
import path from 'path'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [
    ReactPlugin({
      jsxRuntime: 'automatic'
    }),
    RubyPlugin(),
  ],
  resolve: {
    alias: {
      '@cctv/core': path.resolve(fileURLToPath(new URL('.', import.meta.url)), 'app/frontend/Core'),
      '@cctv/components': path.resolve(fileURLToPath(new URL('.', import.meta.url)), 'app/frontend/Components'),
      '@cctv/experiences': path.resolve(fileURLToPath(new URL('.', import.meta.url)), 'app/frontend/Experiences'),
      '@cctv/pages': path.resolve(fileURLToPath(new URL('.', import.meta.url)), 'app/frontend/Pages'),
      '@cctv/utils': path.resolve(fileURLToPath(new URL('.', import.meta.url)), 'app/frontend/utils'),
      '@cctv/types': path.resolve(fileURLToPath(new URL('.', import.meta.url)), 'app/frontend/types'),
    }
  }
})
