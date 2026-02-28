# Expo + Next + Convex Turborepo Template

## Stack
- pnpm + Turborepo
- Expo (Expo Router) mobile app
- Next.js web app
- Convex backend
- Biome formatter/linter
- TypeScript everywhere

## Prerequisites
- Node.js 18+ (corepack recommended)
- VS Code (Biome extension) or your preferred editor

## Getting Started
2. Copy envs
   ```bash
   cp .env.example .env.local
   ```
   A postinstall script symlinks `.env.local` into each app/package.
3. Enable corepack and install dependencies
   ```bash
   corepack enable
   pnpm install
   ```
5. Run dev servers
   ```bash
   pnpm dev
   ```

## Useful scripts
- `pnpm dev:expo`
- `pnpm dev:web`
- `pnpm dev:backend`
- `pnpm lint` | `pnpm format` | `pnpm typecheck` | `pnpm build` | `pnpm test`
