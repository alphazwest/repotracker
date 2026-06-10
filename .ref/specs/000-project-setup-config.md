# 000 — Project Setup & Config

> **Read first:** @README.md — workstream plan, sequencing, file ownership, and architecture guardrails.

## Concern

Establish repo-wide conventions, tooling, and config so all later work is
consistent and lint/format/typecheck clean from the start.

## Scope (high-level)

- **Layout roots:** backend in `/backend`, frontend in `/frontend`. React/TS
  source lives under `frontend/src`.
- **Frontend build:** Vite (React + TypeScript).
- **Linting/formatting:** ESLint + Prettier across both workspaces, using
  **Airbnb conventions** where relevant (Airbnb base for backend, Airbnb +
  React/hooks for frontend). Reconcile any Prettier/ESLint conflicts.
- **Style rules (enforced by config):**
  - 2-space indentation.
  - Max line length **90**.
  - Prefer **named prop/param interfaces** over inline object typing.
  - TypeScript strict mode, both workspaces.
- Shared editor config (`.editorconfig`) so the above hold outside the linters.

## Defer to implementer

Package manager, whether configs are shared/extended vs. per-workspace, exact
Airbnb rule overrides needed to fit the codebase, flat vs. legacy ESLint config.

## Files

Owns (creates):
- `/.editorconfig`
- `/backend/package.json`, `/backend/tsconfig.json`, `/backend/.eslintrc.cjs`,
  `/backend/.prettierrc`
- `/frontend/package.json`, `/frontend/tsconfig.json`,
  `/frontend/tsconfig.node.json`, `/frontend/.eslintrc.cjs`,
  `/frontend/.prettierrc`, `/frontend/vite.config.ts`

## Dependencies

None (first spec).

## Acceptance

- `lint`, `format:check`, and `typecheck` scripts exist and pass on an empty
  scaffold in both workspaces.
- Violations of indent / line-length / inline-typing are flagged.

## Tests (critical paths)

- None — config/tooling spec. Verified by the `lint`, `format:check`, and
  `typecheck` scripts passing (see Acceptance), not by spec'd tests.

## Alignment review

- **Requirements:** establishes the "fully typed, production-quality, no
  duplication" non-functional bar. ✓
- **Not over-constrictive:** package manager and config layout deferred; only the
  named tools and the four style rules are fixed (explicit user direction). ✓
- **PRD conformance:** Vite/ESLint/Prettier are FE/tooling choices within the
  React/TS + Node/TS stack; no stack drift. ✓
