import { defineConfig } from 'vite'
import ReactPlugin from "@vitejs/plugin-react"
import RubyPlugin from 'vite-plugin-ruby'

export default defineConfig({
  plugins: [
    ReactPlugin({
      jsxRuntime: 'automatic'
    }),
    RubyPlugin(),
  ]
})
