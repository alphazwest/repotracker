# 010 — Search, Filter & Pagination

> **Read first:** @README.md — workstream plan, sequencing, file ownership, and architecture guardrails.

## Concern

Let the user narrow and page the tracked list, and surface an unseen count that
doubles as a quick-filter. Backed by the server-side query.

## Scope (high-level)

- **Sub-toolbar** with search + filter operating over all displayed fields
  (name, description, languages, stars/watchers/forks).
- **Unseen count** on the top toolbar that doubles as a quick-filter for unseen
  repos.
- **Pagination** at the bottom; engages past 10 repos, single page below that.
- Wire these to the `trackedRepos(search, filter, page, pageSize)` +
  `unseenCount` query (server-side, per design).

## Defer to implementer

Debounce strategy, filter UI affordances, page-size, URL/state sync.

## Files

Owns (creates), under `/frontend/src/`:
- `components/SearchFilterBar/{SearchFilterBar.tsx,hooks.ts,types.ts,index.ts}`
- `components/Pagination/{Pagination.tsx,index.ts}`
- `components/UnseenCountBadge/{UnseenCountBadge.tsx,index.ts}`
- `lib/apollo/operations/unseenCount.ts`

Touches:
- `lib/apollo/operations/repos.ts` (008) — extends `trackedRepos` with
  `search`/`filter`/`page`/`pageSize` args.

Tests:
- `SearchFilterBar/SearchFilterBar.test.tsx`, `Pagination/Pagination.test.tsx`

## Dependencies

008 (005 for the query args).

## Acceptance

- Search/filter narrow results via the server query; counts stay correct.
- Pagination appears only past 10; quick-filter toggles unseen-only.

## Tests (critical paths)

- Search narrows the list via the server query. — **Vitest browser (functional)**
- Filter (languages / unseen quick-filter) narrows the list. — **Vitest browser (functional)**
- Pagination appears past 10 repos, hidden below. — **Vitest browser (functional)**

## Alignment review

- **Requirements:** search/filter over metadata, unseen quick-filter + count,
  pagination threshold (10). ✓
- **Not over-constrictive:** debounce/affordances/page-size deferred; only "use
  the server-side query" and the 10-row threshold are fixed by design. ✓
- **PRD conformance:** consumes the defined GraphQL contract; no drift. ✓
