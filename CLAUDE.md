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
pnpm seed         # Remove the polls of the first demo from existing databases (also run by prestart)
pnpm sync:assembly # Import bills and votes from the Assemblée nationale open data (also runs every 6h when CRON_SECRET is set)
pnpm sync:journeys # Refresh the path of each bill in Parliament (readings, joint committee, Constitutional Council, promulgation), also part of sync:assembly
pnpm import:congress # Import past constitutional revisions voted by the Congrès (list in the script), with every vote on them
pnpm seed:referendums # Create or update the national referendums of the Fifth Republic with their official results (also run by prestart)
pnpm sync:senate   # Add the Senate's public vote on the whole text and each senator's vote to the bills (data.senat.fr, also part of sync:assembly)
pnpm extract:hemicycle # Regenerate the seat plans of both hemicycles from the Assemblée and Senate websites
pnpm summarize    # Generate missing plain-language summaries with Gemini (needs GOOGLE_GENERATIVE_AI_API_KEY, also runs after each 6h sync)
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

- `auth/` — Better Auth instance (`index.ts`), zkPassport sign-in plugin (`zkpassport-plugin.ts`) + client hooks (`client.ts`)
- `zkpassport/` — proof query shared by browser and server (`query.ts`), server verification (`verify.ts`), identity key HMAC (`identity.ts`), card ↔ account resolution (`citizen.ts`), fictional dev citizens (`test-citizens.ts`)
- `blind-signature/` — RSA-PSS key management + signing (`index.ts`) + client-side blinding (`client.ts`)
- `poll/` — fetch (`fetch.ts`), results aggregation (`results.ts`), Redis pub/sub events (`events.ts`), Merkle tree hashing (`merkle.ts`)
- `rekor/` — publish merkle root to Sigstore Rekor transparency log after each vote
- `github/` — batch publish merkle root to GitHub repo every 30s
- `reset.ts` — clear vote data (used by cron + reset API)
- `redis.ts` — singleton Redis publisher/subscriber instances

### Cryptographic Vote Flow

1. Client generates random 32-byte token, blinds it with poll's RSA public key
2. Client POSTs blinded token to `/api/poll/[pollId]/blind-sign` (requires zkPassport auth)
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

### zkPassport Authentication

Citizens sign in by scanning their French national ID card with the ZKPassport app (QR code on `/login`). The zero-knowledge proof requires French nationality, a national ID card, age 18+ and a strict facematch, and is verified locally on the server (`POST /api/auth/zkpassport/sign-in`).

Accounts hold no identity: the `citizen` table stores an identity key (HMAC of names, birthdate and gender with `IDENTITY_KEY_SECRET`) and the current card's salted zkPassport identifier. A new card of a known identity replaces the old one (renewal, lost card); a replaced card showing up again freezes the account (`conflict`).

In development, fictional citizens on `/login` sign in through `/api/auth/zkpassport/test-sign-in`, and `/dev/zkpassport` shows what a real card discloses without creating a session.

### Plain-Language Summaries

Each poll can have an AI summary (`pollSummary` table): very simple sentence, plain title, summary, "Pour comprendre" context and concrete changes. Generated by Gemini through the AI SDK (`src/services/summary/`): a draft, then a neutrality review pass, both driven by the versioned prompt in `prompt.ts`. Bump `SUMMARY_PROMPT_VERSION` when changing it: outdated summaries are regenerated by the next run. The poll page labels them as AI-generated, links to the prompt, and lets readers report errors (`summaryReport` table). `/dev/summaries` compares prompt versions on a sample (`pnpm summarize:prototype`, `--same` to rerun the same polls).

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
