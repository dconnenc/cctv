# React + TypeScript SPA (Vite)

A minimal Single Page Application scaffold using Vite, React 18, and TypeScript.

## Prerequisites
- Node.js 18+ recommended (Vite 5 requires Node 18)

## Setup
- Install dependencies: `npm install`
- Start dev server: `npm run dev`
- Build for production: `npm run build`
- Preview build locally: `npm run preview`

## Checks
- Typecheck: `npm run typecheck`
- Format: `npm run format`
- Format check: `npm run format:check`

## Project Structure
- `index.html`: App entry HTML with `#root`
- `src/main.tsx`: React root renderer
- `src/App.tsx`: Starter component
- `src/styles.css`: Minimal global styles
- `vite.config.ts`: Vite config with React plugin
- `tsconfig*.json`: TypeScript config
 - `.prettierrc`, `.prettierignore`: Prettier config files
 

## Notes
- This is a SPA base; add routing (e.g., React Router) as needed.
- If you use path aliases, update `tsconfig.json` and Vite `resolve.alias`.
