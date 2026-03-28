# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

republique.vote — transparent online voting platform (POC) for French citizens. Uses cryptographic techniques (blind signatures RSA-PSS, Merkle trees) to enable verifiable anonymous voting. Every vote is signed, published publicly, and mathematically verifiable by anyone.

## Commands

```bash
pnpm db:dev       # Start Postgres + Redis in-memory (background)
pnpm db:push      # Push schema to database (drizzle-kit push)
pnpm seed         # Seed database with test polls
pnpm dev          # Start dev server (http://localhost:3000)
pnpm build        # Production build
pnpm start        # Start production server (prestart: push + seed)
pnpm lint         # Check code with Ultracite (Biome engine)
pnpm lint:fix     # Auto-fix formatting/linting issues
pnpm postgres     # Start embedded Postgres only (:5432)
pnpm redis        # Start in-memory Redis only (:6379)
```

## Architecture

Next.js 16 App Router with TypeScript (strict mode). Path aliases: `@/*` → `./src/*`, `env` → `./env.ts`.

### Design System

Shadcn/ui (Radix primitives) + Tailwind CSS v4. Design inspired by DSFR (French government design system) but using free components for legal reasons. Sharp corners (radius: 0), DSFR blue-france color palette (#000091 light / #8585f6 dark). Geist font. Dark mode via `next-themes`.

### Server vs Client Components

- **Server components**: `layout.tsx`, `polls/page.tsx`, `polls/[pollId]/page.tsx` — fetch data directly from DB
- **Client components**: voting UI, real-time results, auth header, theme toggle — use `"use client"` directive
- SSR pages pass initial data as props to client components for hydration

### Services Layer (`src/services/`)

- `auth/` — Better Auth instance (`index.ts`) + client hooks (`client.ts`)
- `blind-signature/` — RSA-PSS key management + signing (`index.ts`) + client-side blinding (`client.ts`)
- `poll/` — results aggregation (`results.ts`), Redis pub/sub events (`events.ts`), Merkle tree hashing (`merkle.ts`)
- `redis.ts` — singleton Redis publisher/subscriber instances
- `swr.ts` — SWR fetcher config

### Cryptographic Vote Flow

1. Client generates random 32-byte token, blinds it with poll's RSA public key
2. Client POSTs blinded token to `/api/poll/[pollId]/blind-sign` (requires FranceConnect auth)
3. Server signs blindly (one request per user-poll), returns blind signature
4. Client unblinds → valid signature on original token
5. Client POSTs vote with token + signature to `/api/poll/[pollId]/vote` (no auth — signature is the proof)
6. Server verifies signature, inserts vote with hash chain (Merkle tree), updates merkle root, emits Redis event

### Real-time Results

SSE via `/api/poll/[pollId]/results/stream`. Redis pub/sub channel `poll-results:[pollId]`. Client uses `EventSource` + SWR for initial data.

### Database

PostgreSQL with Drizzle ORM (postgres-js driver). Dev: `embedded-postgres` on port 5432. Prod: Railway Postgres via `DATABASE_URL`. Auth uses the same database via `drizzleAdapter`. Schema at `src/db/schema.ts`. Schema push via `drizzle-kit push`.

Key tables: `poll`, `option`, `pollKeyPair`, `blindSignatureRequest` (one per user-poll), `voteRecord` (immutable ledger with hash chain).

### Mock FranceConnect

Development auth at `/api/mock-fc/*`. Test users in `src/app/api/mock-fc/test-users.ts`. Click a user card to login — no real credentials needed.

## API Response Format

All endpoints use consistent format via `src/lib/api-response.ts`:
```typescript
{ success: true, data: T }           // success
{ success: false, statusCode, message }  // error
```

## Styling

Tailwind CSS classes. Shadcn/ui components in `src/components/ui/`. Custom variants added to Badge (`success`, `info`, `warning`), Alert (`success`, `info`, `warning`, `destructive`), and Tabs (`framed` — DSFR-inspired tabbed panel). DSFR-like tab styling in `globals.css` via `[data-variant="framed"]` selectors.

## Linting

Ultracite (Biome engine) — configured in `biome.jsonc` extending `ultracite/biome/core`, `next`, `react`. Copilot coding standards in `.github/copilot-instructions.md`. Run `pnpm lint:fix` before committing. Key rules: prefer `node:` protocol for Node.js imports, explicit `type="button"` on buttons, `aria-label` on SVGs, no nested ternaries (extract components instead), `key` props from stable data (not array indices).

## Language

All user-facing content is in French. Code (variables, comments) in English.
