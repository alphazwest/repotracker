# 011 — Docs & Demo Data

> **Read first:** @README.md — workstream plan, sequencing, file ownership, and architecture guardrails.

## Concern

Make the project runnable and demo-able by a fresh reader, and document what was
built and what was deferred.

## Scope (high-level)

- **README**: setup, local run steps (backend, frontend, Postgres), environment
  config, what's implemented, trade-offs made, and suggested future work.
- **Seed / demo data**: a small set of well-known repos so the app shows
  something immediately, plus an implicit demo user.
- `.env.example` complete enough to run from clone.

## Defer to implementer

Seed mechanism (script vs. migration), which repos, README depth beyond the
required sections.

## Files

Owns (creates):
- `/README.md`
- `/backend/prisma/seed.ts`

Touches:
- `/backend/package.json` — adds the seed script.

Tests:
- optional `/backend/prisma/seed.test.ts` (seed smoke).

## Dependencies

All prior (documents the finished system).

## Acceptance

- A reader can clone, configure, run, and see populated data without prior
  context.
- README covers the four submission-required notes.

## Tests (critical paths)

- None required — docs/delivery. Optionally a smoke check that the seed script
  runs cleanly against a fresh DB.

## Alignment review

- **Requirements:** satisfies the submission guidelines (README w/ setup, run,
  implemented, trade-offs, future). ✓
- **Not over-constrictive:** seed mechanics and content deferred; only the
  required README sections + "runnable from clone" are fixed. ✓
- **PRD conformance:** documentation only. README trade-offs section is the right
  place to note the Apollo-vs-alternatives and in-process-sync decisions. ✓
