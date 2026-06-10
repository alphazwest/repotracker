# 004 — Business Logic (BAL)

> **Read first:** @README.md — workstream plan, sequencing, file ownership, and architecture guardrails.

## Concern

The application's behavior, independent of transport (GraphQL) and storage
(Prisma). Orchestrates the DAL and the GitHub integration; consumes and returns
DTOs only.

## Scope (high-level)

- Services for the core operations: **track** a repo (resolve via GitHub, upsert
  Repo, link to user, set the seen watermark to current latest), **untrack**,
  **mark seen** (watermark → current latest version), **list tracked repos**
  (search/filter/pagination inputs → DAL via the shared `where`-builder; compute
  `unseen` and `unseenCount`), and **sync** one or many repos (refresh metadata +
  latest release).
- All inputs/outputs are DTOs. No transport or ORM concerns here.
- Tenancy: operations take a `userId` (the implicit demo user for now).

## Defer to implementer

Service decomposition (one module vs. several), how `unseen` is computed
(in-query vs. post-map), error/result typing conventions.

## Files

Owns (creates), under `/backend/src/services/`:
- `repos.ts` — track / untrack / markSeen / list
- `sync.ts` — `syncRepo` / `syncTrackedRepos` (consumed by 005 + 006)
- `index.ts`

Tests:
- `/backend/src/services/repos.test.ts`, `/backend/src/services/sync.test.ts`

## Dependencies

002, 003.

## Acceptance

- Each operation works against a test/dev DB end-to-end through the layers.
- `unseen` correctly reflects latest-version vs. watermark.

## Tests (critical paths)

- Track: upserts the repo, links the user, sets watermark = current latest
  version. — **Jest unit**
- Mark seen: watermark advances to the repo's current latest version. — **Jest unit**
- List: search/filter/pagination applied; `unseen` + `unseenCount` correct. — **Jest unit**

(DAL + GitHub integration mocked, or run against a disposable test DB.)

## Alignment review

- **Requirements:** covers track / untrack / mark-seen / list+unseen / sync —
  the full functional core. ✓
- **Not over-constrictive:** decomposition and computation strategy deferred;
  only the layer's purity (DTOs, `userId` param) is fixed. ✓
- **PRD conformance:** pure TS logic, no stack implications. ✓
