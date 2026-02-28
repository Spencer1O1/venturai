# Expo + Next + Convex Turborepo Template

## Project Abstract
Venturai is a cross-platform asset assessment and maintenance coordination system that helps teams capture equipment condition in the field, route findings into actionable work items, and monitor operational risk in a shared dashboard. The platform combines guided inspections, role-based workflows, and AI-assisted analysis so inspectors, operators, and maintainers can move from reported issues to tracked remediation with a consistent audit trail.

Technical details: the monorepo uses pnpm + Turborepo with TypeScript across an Expo mobile app, a Next.js web dashboard, and a Convex backend; inspection submissions can include photo evidence and structured questionnaire inputs, while backend functions validate AI outputs and update persistent asset/work-item records.

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
