# 008 — Repo List & Views

> **Read first:** @README.md — workstream plan, sequencing, file ownership, and architecture guardrails.

## Concern

The primary screen: render tracked repos, with the latest-release version as the
headline and a clear unseen indicator. Support the list/card view toggle.

## Scope (high-level)

- A repo-list feature (concentration of concern) rendering each repo: **version
  + date (primary)**, name, description, author (owner + avatar), seen/unseen
  indicator, metadata (stars, watchers, forks, languages top-3), and a
  sync-freshness badge.
- The sync-freshness badge reflects `lastSyncStatus` — including a **failed /
  stale** state — so a repo whose GitHub sync errored is visible, not silently
  shown with old data (graceful-degradation surface for sync failures).
- **Two togglable views** — list (compact rows) and card; a row is a density
  variant of the same content.
- Unseen repos are visually distinct.
- Handle empty (no repos), loading, and error states.

## Defer to implementer

Component breakdown, visual treatment of the unseen indicator, how the toggle
persists (or not), badge formatting.

## Files

Owns (creates), under `/frontend/src/components/RepoList/`:
- `RepoList.tsx`, `index.ts`, `types.ts`, `hooks.ts`
- `components/RepoCard.tsx`, `components/RepoRow.tsx`,
  `components/UnseenIndicator.tsx`, `components/SyncBadge.tsx`,
  `components/ViewToggle.tsx`
- `/frontend/src/lib/apollo/operations/repos.ts` — `trackedRepos` document
  (010 extends with args)

Seam: `RepoCard` exposes an action slot (render-prop/children) for 009's
per-repo controls — 009 does not edit `RepoCard`.

Tests:
- `RepoList/RepoList.test.tsx`, `RepoList/components/RepoCard.test.tsx`

## Dependencies

007 (005 for real data).

## Acceptance

- Tracked repos render in both views; latest version is the visual headline.
- Unseen repos are unmistakable at a glance; empty/loading/error covered.

## Tests (critical paths)

- Renders repos with latest-release **version + date** as the headline. — **Vitest browser (functional)**
- Unseen repo is visually distinct from a seen repo. — **Vitest browser (functional)**
- List/card toggle switches the view. — **Vitest browser (functional)**
- Empty / loading / error states render. — **Vitest browser (functional)**

## Alignment review

- **Requirements:** "view latest release", "visual indicator for unseen",
  list+card views, metadata display. ✓
- **Not over-constrictive:** component breakdown and styling deferred; only the
  content set, view toggle, and version-as-headline are fixed. ✓
- **PRD conformance:** pure FE; no stack implications. ✓
