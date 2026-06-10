# 007 — Frontend Scaffolding & Theme

> **Read first:** @README.md — workstream plan, sequencing, file ownership, and architecture guardrails.

## Concern

Stand up the React app shell: MUI, Apollo Client, the centralized theme, and the
provider/context wiring. Establish the concentration-of-concern conventions.

## Scope (high-level)

- React + TypeScript app with MUI and Apollo Client configured against the
  GraphQL endpoint.
- **Owns the client-side caching strategy** (the PRD non-functional
  requirement): the Apollo normalized cache + any type policies, and the
  post-mutation cache-update **convention** — mutations return the updated entity
  so the cache patches by `id`; list-membership/order changes refetch the list
  query. Feature specs (009, 010) apply this convention; it is defined here.
- Centralized theme via one `createTheme()` parameterized by **mode**
  (light/dark) and **density** (compact/comfortable), exposed through a global
  context; everything reads from the theme.
- App providers/shell; folder conventions per techdesign (component-scoped code
  colocated, cross-cutting code hoisted).
- Apollo operations organized modularly (documents + typed hooks), per best
  practice; codegen optional.

## Defer to implementer

Build tool specifics, codegen on/off, context vs. minimal state for theme
toggles, exact provider nesting.

## Files

Owns (creates), under `/frontend/src/`:
- `app/providers.tsx`, `app/AppShell.tsx`, `app/index.ts`
- `theme/createAppTheme.ts`, `theme/ThemeModeContext.tsx`, `theme/index.ts`
- `lib/apollo/client.ts`, `lib/apollo/index.ts`
- `context/UserContext.tsx`

Touches:
- `frontend/src/main.tsx` — wrap providers (append).

Tests:
- `frontend/src/theme/theme.test.tsx`

## Dependencies

000, 001 (005 for a live endpoint; can mock until then).

## Acceptance

- App renders with theme applied; mode + density toggles affect the whole UI.
- Apollo Client issues a query against the backend (or mock); cached data
  renders instantly and the post-mutation update convention is documented.

## Tests (critical paths)

- Theme: toggling mode (light/dark) and density (compact/comfortable) applies
  across the shell. — **Vitest browser (functional)**

## Alignment review

- **Requirements:** establishes client-side caching (Apollo) + the design-system
  controls (density, dark/light). ✓
- **Not over-constrictive:** codegen/state specifics deferred; only the data
  layer (Apollo), theme centralization, and structure conventions are fixed
  (explicit product/design decisions). ✓
- **PRD conformance:** React/TS + MUI + Apollo Client as specified. ✓
