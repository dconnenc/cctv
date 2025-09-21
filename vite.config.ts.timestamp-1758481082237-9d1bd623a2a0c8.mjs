// vite.config.ts
import ReactPlugin from "file:///Users/cameronpavao/Projects/cctv/node_modules/@vitejs/plugin-react/dist/index.js";
import { URL, fileURLToPath } from "node:url";
import path from "path";
import { defineConfig } from "file:///Users/cameronpavao/Projects/cctv/node_modules/vite/dist/node/index.js";
import RubyPlugin from "file:///Users/cameronpavao/Projects/cctv/node_modules/vite-plugin-ruby/dist/index.js";
var __vite_injected_original_import_meta_url = "file:///Users/cameronpavao/Projects/cctv/vite.config.ts";
var vite_config_default = defineConfig({
  plugins: [
    ReactPlugin({
      jsxRuntime: "automatic"
    }),
    RubyPlugin()
  ],
  resolve: {
    alias: {
      "@cctv/core": path.resolve(fileURLToPath(new URL(".", __vite_injected_original_import_meta_url)), "app/frontend/Core"),
      "@cctv/components": path.resolve(
        fileURLToPath(new URL(".", __vite_injected_original_import_meta_url)),
        "app/frontend/Components"
      ),
      "@cctv/experiences": path.resolve(
        fileURLToPath(new URL(".", __vite_injected_original_import_meta_url)),
        "app/frontend/Experiences"
      ),
      "@cctv/hooks": path.resolve(
        fileURLToPath(new URL(".", __vite_injected_original_import_meta_url)),
        "app/frontend/Hooks"
      ),
      "@cctv/pages": path.resolve(
        fileURLToPath(new URL(".", __vite_injected_original_import_meta_url)),
        "app/frontend/Pages"
      ),
      "@cctv/utils": path.resolve(
        fileURLToPath(new URL(".", __vite_injected_original_import_meta_url)),
        "app/frontend/utils"
      ),
      "@cctv/types": path.resolve(
        fileURLToPath(new URL(".", __vite_injected_original_import_meta_url)),
        "app/frontend/types"
      ),
      "@cctv/contexts": path.resolve(
        fileURLToPath(new URL(".", __vite_injected_original_import_meta_url)),
        "app/frontend/Contexts"
      ),
      "@cctv/RouteRules": path.resolve(
        fileURLToPath(new URL(".", __vite_injected_original_import_meta_url)),
        "app/frontend/RouteRules"
      )
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMvY2FtZXJvbnBhdmFvL1Byb2plY3RzL2NjdHZcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9Vc2Vycy9jYW1lcm9ucGF2YW8vUHJvamVjdHMvY2N0di92aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vVXNlcnMvY2FtZXJvbnBhdmFvL1Byb2plY3RzL2NjdHYvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgUmVhY3RQbHVnaW4gZnJvbSAnQHZpdGVqcy9wbHVnaW4tcmVhY3QnO1xuaW1wb3J0IHsgVVJMLCBmaWxlVVJMVG9QYXRoIH0gZnJvbSAnbm9kZTp1cmwnO1xuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJztcbmltcG9ydCBSdWJ5UGx1Z2luIGZyb20gJ3ZpdGUtcGx1Z2luLXJ1YnknO1xuXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuICBwbHVnaW5zOiBbXG4gICAgUmVhY3RQbHVnaW4oe1xuICAgICAganN4UnVudGltZTogJ2F1dG9tYXRpYycsXG4gICAgfSksXG4gICAgUnVieVBsdWdpbigpLFxuICBdLFxuICByZXNvbHZlOiB7XG4gICAgYWxpYXM6IHtcbiAgICAgICdAY2N0di9jb3JlJzogcGF0aC5yZXNvbHZlKGZpbGVVUkxUb1BhdGgobmV3IFVSTCgnLicsIGltcG9ydC5tZXRhLnVybCkpLCAnYXBwL2Zyb250ZW5kL0NvcmUnKSxcbiAgICAgICdAY2N0di9jb21wb25lbnRzJzogcGF0aC5yZXNvbHZlKFxuICAgICAgICBmaWxlVVJMVG9QYXRoKG5ldyBVUkwoJy4nLCBpbXBvcnQubWV0YS51cmwpKSxcbiAgICAgICAgJ2FwcC9mcm9udGVuZC9Db21wb25lbnRzJyxcbiAgICAgICksXG4gICAgICAnQGNjdHYvZXhwZXJpZW5jZXMnOiBwYXRoLnJlc29sdmUoXG4gICAgICAgIGZpbGVVUkxUb1BhdGgobmV3IFVSTCgnLicsIGltcG9ydC5tZXRhLnVybCkpLFxuICAgICAgICAnYXBwL2Zyb250ZW5kL0V4cGVyaWVuY2VzJyxcbiAgICAgICksXG4gICAgICAnQGNjdHYvaG9va3MnOiBwYXRoLnJlc29sdmUoXG4gICAgICAgIGZpbGVVUkxUb1BhdGgobmV3IFVSTCgnLicsIGltcG9ydC5tZXRhLnVybCkpLFxuICAgICAgICAnYXBwL2Zyb250ZW5kL0hvb2tzJyxcbiAgICAgICksXG4gICAgICAnQGNjdHYvcGFnZXMnOiBwYXRoLnJlc29sdmUoXG4gICAgICAgIGZpbGVVUkxUb1BhdGgobmV3IFVSTCgnLicsIGltcG9ydC5tZXRhLnVybCkpLFxuICAgICAgICAnYXBwL2Zyb250ZW5kL1BhZ2VzJyxcbiAgICAgICksXG4gICAgICAnQGNjdHYvdXRpbHMnOiBwYXRoLnJlc29sdmUoXG4gICAgICAgIGZpbGVVUkxUb1BhdGgobmV3IFVSTCgnLicsIGltcG9ydC5tZXRhLnVybCkpLFxuICAgICAgICAnYXBwL2Zyb250ZW5kL3V0aWxzJyxcbiAgICAgICksXG4gICAgICAnQGNjdHYvdHlwZXMnOiBwYXRoLnJlc29sdmUoXG4gICAgICAgIGZpbGVVUkxUb1BhdGgobmV3IFVSTCgnLicsIGltcG9ydC5tZXRhLnVybCkpLFxuICAgICAgICAnYXBwL2Zyb250ZW5kL3R5cGVzJyxcbiAgICAgICksXG4gICAgICAnQGNjdHYvY29udGV4dHMnOiBwYXRoLnJlc29sdmUoXG4gICAgICAgIGZpbGVVUkxUb1BhdGgobmV3IFVSTCgnLicsIGltcG9ydC5tZXRhLnVybCkpLFxuICAgICAgICAnYXBwL2Zyb250ZW5kL0NvbnRleHRzJyxcbiAgICAgICksXG4gICAgICAnQGNjdHYvUm91dGVSdWxlcyc6IHBhdGgucmVzb2x2ZShcbiAgICAgICAgZmlsZVVSTFRvUGF0aChuZXcgVVJMKCcuJywgaW1wb3J0Lm1ldGEudXJsKSksXG4gICAgICAgICdhcHAvZnJvbnRlbmQvUm91dGVSdWxlcycsXG4gICAgICApLFxuICAgIH0sXG4gIH0sXG59KTtcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBcVIsT0FBTyxpQkFBaUI7QUFDN1MsU0FBUyxLQUFLLHFCQUFxQjtBQUNuQyxPQUFPLFVBQVU7QUFDakIsU0FBUyxvQkFBb0I7QUFDN0IsT0FBTyxnQkFBZ0I7QUFKbUosSUFBTSwyQ0FBMkM7QUFNM04sSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFDMUIsU0FBUztBQUFBLElBQ1AsWUFBWTtBQUFBLE1BQ1YsWUFBWTtBQUFBLElBQ2QsQ0FBQztBQUFBLElBQ0QsV0FBVztBQUFBLEVBQ2I7QUFBQSxFQUNBLFNBQVM7QUFBQSxJQUNQLE9BQU87QUFBQSxNQUNMLGNBQWMsS0FBSyxRQUFRLGNBQWMsSUFBSSxJQUFJLEtBQUssd0NBQWUsQ0FBQyxHQUFHLG1CQUFtQjtBQUFBLE1BQzVGLG9CQUFvQixLQUFLO0FBQUEsUUFDdkIsY0FBYyxJQUFJLElBQUksS0FBSyx3Q0FBZSxDQUFDO0FBQUEsUUFDM0M7QUFBQSxNQUNGO0FBQUEsTUFDQSxxQkFBcUIsS0FBSztBQUFBLFFBQ3hCLGNBQWMsSUFBSSxJQUFJLEtBQUssd0NBQWUsQ0FBQztBQUFBLFFBQzNDO0FBQUEsTUFDRjtBQUFBLE1BQ0EsZUFBZSxLQUFLO0FBQUEsUUFDbEIsY0FBYyxJQUFJLElBQUksS0FBSyx3Q0FBZSxDQUFDO0FBQUEsUUFDM0M7QUFBQSxNQUNGO0FBQUEsTUFDQSxlQUFlLEtBQUs7QUFBQSxRQUNsQixjQUFjLElBQUksSUFBSSxLQUFLLHdDQUFlLENBQUM7QUFBQSxRQUMzQztBQUFBLE1BQ0Y7QUFBQSxNQUNBLGVBQWUsS0FBSztBQUFBLFFBQ2xCLGNBQWMsSUFBSSxJQUFJLEtBQUssd0NBQWUsQ0FBQztBQUFBLFFBQzNDO0FBQUEsTUFDRjtBQUFBLE1BQ0EsZUFBZSxLQUFLO0FBQUEsUUFDbEIsY0FBYyxJQUFJLElBQUksS0FBSyx3Q0FBZSxDQUFDO0FBQUEsUUFDM0M7QUFBQSxNQUNGO0FBQUEsTUFDQSxrQkFBa0IsS0FBSztBQUFBLFFBQ3JCLGNBQWMsSUFBSSxJQUFJLEtBQUssd0NBQWUsQ0FBQztBQUFBLFFBQzNDO0FBQUEsTUFDRjtBQUFBLE1BQ0Esb0JBQW9CLEtBQUs7QUFBQSxRQUN2QixjQUFjLElBQUksSUFBSSxLQUFLLHdDQUFlLENBQUM7QUFBQSxRQUMzQztBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
