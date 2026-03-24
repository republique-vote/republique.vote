# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

republique.vote — transparent online voting platform (POC) for French citizens. Uses cryptographic techniques (blind signatures, Merkle trees) to enable verifiable anonymous voting. Built with the French government design system (DSFR).

## Commands

```bash
pnpm dev          # Start dev server (auto-runs react-dsfr update-icons via predev)
pnpm build        # Production build (auto-runs react-dsfr update-icons via prebuild)
pnpm start        # Start production server
pnpm lint         # Run ESLint via next lint
```

Note: `predev` and `prebuild` scripts run `react-dsfr update-icons` automatically. The `.npmrc` file enables pre/post scripts for pnpm.

## Architecture

Next.js 16 App Router with TypeScript (strict mode). Path alias `@/*` → `./src/*`.

### DSFR Bootstrap (`src/dsfr-bootstrap/`)

Critical integration layer between Next.js and the French government design system:

- `server-only-index.tsx` — Server-side: exports `getHtmlAttributes` and `DsfrHead` for the root layout
- `index.tsx` — Client-side: exports `DsfrProvider` (wraps `DsfrProviderBase` + `StartDsfrOnHydration`) and `MuiDsfrThemeProvider`
- `defaultColorScheme.ts` — Color scheme config (defaults to "system")

The root `layout.tsx` imports from both files. `DsfrProvider` must wrap all pages. `StartDsfrOnHydration` must be mounted on every page (currently handled in page components).

### MUI Integration

MUI is integrated via `MuiDsfrThemeProvider` which bridges DSFR design tokens to MUI. Uses `@mui/material-nextjs` with `AppRouterCacheProvider` for SSR-compatible CSS-in-JS (Emotion).

### Client vs Server Components

- `layout.tsx` is a server component that sets up providers
- Components needing hooks or interactivity use `"use client"` directive
- Navigation, login header items, and UI components with state are client components

## Styling

DSFR classes (`fr-*`) are the primary styling approach. MUI `sx` prop for MUI components. Emotion CSS-in-JS available. Use `fr.spacing()` for consistent spacing.

## Language

All user-facing content is in French. Code (variables, comments) in English.
