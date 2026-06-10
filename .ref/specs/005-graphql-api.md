# 005 — GraphQL API

> **Read first:** @README.md — workstream plan, sequencing, file ownership, and architecture guardrails.

## Concern

Expose the business logic over GraphQL via Apollo Server. Resolvers are thin:
validate/parse inputs, call the BAL, map DTOs to schema types. No business logic
in resolvers.

## Scope (high-level)

- Apollo Server wired into the backend process.
- Schema per techdesign: `Repo` (incl. denormalized latest-release fields +
  `unseen`), `RepoConnection` (offset pagination), `trackedRepos(search, filter,
  page, pageSize)`, `unseenCount`, and mutations `trackRepo`, `untrackRepo`,
  `markSeen`, `refreshRepo`, `refreshAll`.
- DTO → schema mapping layer; mutations return the updated `Repo` (with `id` +
  changed fields) so the client cache can patch.
- Input validation and typed error surfacing (bad URL, not found, duplicate).
- Organize schema/resolvers modularly (by domain), per GraphQL best practice.

## Defer to implementer

Schema modularization style, codegen usage, validation library, scalar choices.

## Files

Owns (creates):
- `/backend/src/server.ts` — Apollo Server factory
- `/backend/src/schema/typeDefs.ts`, `/backend/src/schema/index.ts`
- `/backend/src/resolvers/repo.ts`, `/backend/src/resolvers/mutations.ts`,
  `/backend/src/resolvers/index.ts`
- `/backend/src/graphql/mappers.ts` — DTO → schema types

Touches:
- `/backend/src/index.ts` — wire `startServer()` (append).

Tests:
- `/backend/src/resolvers/resolvers.test.ts` — **Jest integration** (`executeOperation`)

## Dependencies

004.

## Acceptance

- All queries/mutations resolve against a dev DB.
- `totalCount` and the page share one `where`; counts are consistent.

## Tests (critical paths)

- `trackRepo` / `markSeen` mutations return the updated `Repo` (id + changed
  fields) so the client cache can patch. — **Jest integration**
- `trackedRepos`: `totalCount` matches the page's `where`; connection shape is
  correct. — **Jest integration**
- Input errors surfaced as typed GraphQL errors (bad URL, duplicate). — **Jest integration**

(Executed against the schema, e.g. `executeOperation`; BAL real or mocked.)

## Alignment review

- **Requirements:** exposes the full data + manipulation surface the FE needs. ✓
- **Not over-constrictive:** modularization/codegen/validation deferred; only the
  contract shape and "thin resolvers + DTO mapping" are fixed. ✓
- **PRD conformance:** Apollo Server + GraphQL as specified. ✓
