# 001 — Project Scaffolding

> **Read first:** @README.md — workstream plan, sequencing, file ownership, and architecture guardrails. & Tooling

## Concern

Stand up the two apps so backend and frontend can be developed and run locally
with one command each, against a local Postgres. (Conventions, linting, and TS
config come from 000.)

## Scope (high-level)

- Scaffold backend at `/backend` and frontend at `/frontend` (`frontend/src`),
  per the conventions in 000. Internal layout per techdesign.
- Local Postgres for dev (e.g. Docker Compose) and environment config
  (`.env.example`).
- Dev scripts: run backend, run frontend, run both.

## Defer to implementer

Package manager, exact script names, monorepo tooling (workspaces vs. two
`package.json`s) — pick the lowest-friction option.

## Files

Owns (creates):
- `/docker-compose.yml`
- `/backend/.env.example`
- `/backend/src/index.ts` — server boot shell (shared composition root)
- `/frontend/.env.example`, `/frontend/index.html`
- `/frontend/src/main.tsx` — app entry (shared composition root)
- `/frontend/src/App.tsx`, `/frontend/src/vite-env.d.ts`

Touches:
- `*/package.json` — adds run/dev scripts.

## Dependencies

000.

## Acceptance

- `/backend` boots and connects to Postgres; `/frontend` serves a blank shell.
- Lint + typecheck pass on both (config from 000).

## Tests (critical paths)

- None — scaffolding spec. Boot + DB connection verified per Acceptance; no
  behavioral critical path to assert yet.

## Alignment review

- **Requirements:** enables all downstream work; no product requirement touched
  directly. ✓
- **Not over-constrictive:** tooling choices deferred; only the directory shape
  and "typed + lint/format" are fixed. ✓
- **PRD conformance:** Node/TS + Postgres + React/TS only; no stack drift. ✓
