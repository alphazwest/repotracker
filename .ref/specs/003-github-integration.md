# 003 — GitHub Integration

> **Read first:** @README.md — workstream plan, sequencing, file ownership, and architecture guardrails.

## Concern

Isolate all GitHub/Octokit access behind one module that fetches what we need
and maps raw API responses into our domain DTOs. No other layer touches Octokit
shapes.

## Scope (high-level)

- Configured Octokit client with the **throttling plugin** (primary + secondary
  rate limits).
- Functions to: resolve a repo from a URL/`owner/name`, fetch repo data, and
  fetch the **latest release** (version, date, url).
- Map responses to domain DTOs for the persisted fields: `githubId`, `owner`,
  `name`, `description`, `url`, `authorUrl`, `avatarUrl`, `stars`, `watchers`,
  `forks`, `languages` (top 3), and the latest release.
- `stars` = `stargazers_count` (the one canonical star metric; ignore the
  `watchers_count` alias). `watchers` = `subscribers_count`, already included in
  the repo GET.
- Surface "not found" / API errors as typed results the caller can handle.
- Transient-error retry with backoff (e.g. `p-retry`); rate-limit retries are
  owned by the throttling plugin.

## Defer to implementer

REST vs. GraphQL GitHub API, exact endpoints, languages-color sourcing, DTO
field names.

## Files

Owns (creates), under `/backend/src/github/`:
- `client.ts` — Octokit + throttling
- `parse.ts` — URL / `owner/name` parsing
- `map.ts` — response → DTO
- `types.ts`, `index.ts`

Tests:
- `/backend/src/github/parse.test.ts`, `/backend/src/github/map.test.ts`

## Dependencies

001 (002 for the shared DTO types in `/backend/src/dto`).

## Acceptance

- Given a real repo, returns populated metadata + latest release DTO.
- Missing repo / no releases handled without throwing unhandled errors.

## Tests (critical paths)

- URL / `owner/name` parsing: valid and malformed inputs. — **Jest unit**
- Response → DTO mapping: metadata, languages (top 3), latest release. — **Jest unit**
- Repo-not-found / no-release surfaced as a typed result, not a throw. — **Jest unit**

(Octokit mocked.)

## Alignment review

- **Requirements:** supplies latest release (version/date) + metadata; rate-limit
  + retry resilience. ✓
- **Not over-constrictive:** API flavor and DTO names open; only "isolate Octokit
  + map to DTO + handle limits" is fixed. ✓
- **PRD conformance:** Octokit as specified; public GitHub API. ✓
