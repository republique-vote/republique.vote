# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

republique.vote — transparent online voting platform (POC) for French citizens. Uses cryptographic techniques (blind signatures RSA-PSS, Merkle trees) to enable verifiable anonymous voting. Every vote is signed, published publicly, and mathematically verifiable by anyone.

## Monorepo Structure

pnpm workspaces. Root app (Next.js) + shared packages.

- `.` — Next.js 16 App Router (the web app)
- `packages/core` (`@republique/core`) — shared types, hash logic, date formatting, API response types
- `packages/observer` (`@republique/observer`) — CLI to monitor votes in real-time and verify chain integrity

## Commands

```bash
# Web app (run from root)
pnpm db:dev       # Start Postgres + Redis in-memory (background)
pnpm db:push      # Push schema to database (drizzle-kit push)
pnpm seed         # Seed database with test polls
pnpm dev          # Start dev server (http://localhost:3000)
pnpm build        # Production build
pnpm start        # Start production server (prestart: push + seed)
pnpm -w lint      # Check code with Ultracite (Biome engine) — use -w for monorepo
pnpm -w lint:fix  # Auto-fix formatting/linting issues
pnpm postgres     # Start embedded Postgres only (:5432)
pnpm redis        # Start in-memory Redis only (:6379)

# Packages
pnpm --filter @republique/core build      # Build core package (tsup)
pnpm --filter @republique/observer build   # Build observer CLI (tsup)
pnpm --filter @republique/observer dev -- <pollId>  # Run observer in dev
```

## Architecture

Next.js 16 App Router with TypeScript (strict mode). Path aliases: `@/*` → `./src/*`, `env` → `./env.ts`.

### Shared Package (`@republique/core`)

Single source of truth for types and logic shared between web app, observer CLI, and future packages:
- `Vote`, `PollOption`, `ResultData`, `ResultsResponse` — domain types
- `ApiResponse`, `ApiSuccessResponse`, `ApiErrorResponse`, `parseApiResponse` — API contract
- `buildVoteHashPreimage` — merkle hash preimage (caller provides SHA-256 impl for Node/browser compat)
- `formatDate`, `formatDateShort` — date formatting via `date-fns` with French locale

Import directly from `@republique/core`, never re-export or duplicate types.

### Design System

Shadcn/ui (Radix primitives) + Tailwind CSS v4. Design inspired by DSFR (French government design system) but using free components for legal reasons. Sharp corners (radius: 0), DSFR blue-france color palette (#000091 light / #8585f6 dark). Dark mode via `next-themes`.

### Server vs Client Components

- **Server components**: `layout.tsx`, `polls/page.tsx`, `polls/[pollId]/page.tsx` — fetch data directly from DB
- **Client components**: voting UI, real-time results, auth header, theme toggle — use `"use client"` directive
- SSR pages pass initial data as props to client components for hydration

### Services Layer (`src/services/`)

- `auth/` — Better Auth instance (`index.ts`) + client hooks (`client.ts`)
- `blind-signature/` — RSA-PSS key management + signing (`index.ts`) + client-side blinding (`client.ts`)
- `poll/` — fetch (`fetch.ts`), results aggregation (`results.ts`), Redis pub/sub events (`events.ts`), Merkle tree hashing (`merkle.ts`)
- `rekor/` — publish merkle root to Sigstore Rekor transparency log after each vote
- `github/` — batch publish merkle root to GitHub repo every 30s
- `reset.ts` — clear vote data (used by cron + reset API)
- `redis.ts` — singleton Redis publisher/subscriber instances

### Cryptographic Vote Flow

1. Client generates random 32-byte token, blinds it with poll's RSA public key
2. Client POSTs blinded token to `/api/poll/[pollId]/blind-sign` (requires FranceConnect auth)
3. Server signs blindly (one request per user-poll), returns blind signature
4. Client unblinds → valid signature on original token
5. Client POSTs vote with token + signature to `/api/poll/[pollId]/vote` (no auth — signature is the proof)
6. Server verifies signature, inserts vote with hash chain (Merkle tree), updates merkle root
7. Publishes merkle root to Sigstore Rekor (immediate) + queues GitHub commit (batch 30s)
8. Emits Redis events for real-time SSE streams

### Transparency (Rekor + GitHub)

Each vote's merkle root is published to Sigstore Rekor (immutable transparency log) and to a GitHub repo (`republique-vote/merkle-proofs`). Rekor entries are stored in `rekorEntry` table and displayed per-vote in the board UI.

### Real-time Results

SSE via `/api/poll/[pollId]/results/stream`. Redis pub/sub channel `poll-results:[pollId]`. Client uses `EventSource` + SWR for initial data.

### Database

PostgreSQL with Drizzle ORM (postgres-js driver). Dev: `embedded-postgres` on port 5432. Prod: Railway Postgres via `DATABASE_URL`. Schema at `src/db/schema.ts`. Schema push via `drizzle-kit push`.

Key tables: `poll`, `option`, `pollKeyPair`, `blindSignatureRequest` (one per user-poll), `voteRecord` (immutable ledger with hash chain), `rekorEntry` (Sigstore transparency log entries).

### Demo Reset Cron

`src/instrumentation.ts` registers a `setInterval` (10 min) that clears vote data in production. Clock-aligned to :00/:10/:20 etc. Banner with live countdown in `src/components/demo-banner.tsx`.

### Mock FranceConnect

Development auth at `/api/mock-fc/*`. Test users in `src/app/api/mock-fc/test-users.ts`. Click a user card to login — no real credentials needed.

## API Response Format

All endpoints use the format defined in `@republique/core`:
```typescript
{ success: true, data: T }           // success
{ success: false, statusCode, message }  // error
```

Use `parseApiResponse<T>(res)` from `@republique/core` to parse fetch responses.

## Component Organization

- `src/components/ui/` — Shadcn/ui primitives + `Breadcrumbs` (reusable)
- `src/components/polls/board/` — board page components (table, mobile list, detail dialog, header)
- `src/components/polls/poll-detail/` — poll detail components (vote dialog, options, status alerts)
- `src/components/how-it-works/` — how-it-works page sections
- `src/components/og/` — shared SVG components for OG/icon image generators
- `src/components/auth/` — auth header item, login form

Keep files under 400 lines. Extract components when a file grows beyond that.

## Styling

Tailwind CSS classes. Custom variants on Badge (`success`, `info`, `warning`), Alert (`success`, `info`, `warning`, `destructive`), and Tabs (`framed`). DSFR-like tab styling in `globals.css` via `[data-variant="framed"]` selectors.

## Linting

Ultracite (Biome engine) — configured in `biome.jsonc`. Run `pnpm -w lint:fix` before committing. Key rules: prefer `node:` protocol for Node.js imports, explicit `type="button"` on buttons, `aria-label` on SVGs, no nested ternaries (extract components instead), `key` props from stable data (not array indices). No code duplication — types and utils go in `@republique/core`.

## Language

All user-facing content is in French. Code (variables, comments) in English.
