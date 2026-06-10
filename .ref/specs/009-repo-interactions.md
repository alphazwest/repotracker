# 009 — Repo Interactions

> **Read first:** @README.md — workstream plan, sequencing, file ownership, and architecture guardrails.

## Concern

The user actions on the list: add, remove, mark seen, refresh — each at the
friction level the PRD specifies, with toast feedback.

## Scope (high-level)

- **Add a repo** — modal that takes a URL/`owner/name` and shows a read-only
  preview (name, description, latest release, metadata) before confirming.
- **Remove a repo** — confirmation modal required.
- **Mark as seen** — low-friction inline action; no modal.
- **Refresh** — both per-repo (single) and global (refresh all).
- **Toasts** for action results and errors. **GitHub/API failures** (rate limit,
  GitHub unreachable, repo not found on add) surface here as toasts; the
  add-modal shows validation/not-found errors inline before confirming. This is
  the UI surface for graceful GitHub-API-failure handling on user actions.
- Mutations return updated entities so the Apollo cache patches in place; list-
  membership changes refetch the list query.

## Defer to implementer

Modal/library choice, inline-action affordance, toast library, optimistic vs.
refetch tactics.

## Files

Owns (creates), under `/frontend/src/`:
- `features/addRepo/{AddRepoModal.tsx,hooks.ts,index.ts}`
- `features/removeRepo/{ConfirmRemoveDialog.tsx,index.ts}`
- `features/markSeen/{MarkSeenButton.tsx,index.ts}`
- `features/refresh/{RefreshControls.tsx,hooks.ts,index.ts}`
- `lib/apollo/operations/mutations.ts` — track/untrack/markSeen/refresh*
- `lib/toast/{ToastProvider.tsx,index.ts}`

Fills 008's `RepoCard` action slot with `MarkSeenButton` (+ per-repo refresh).

Tests:
- per-feature `*.test.tsx` (**Vitest browser**)
- `/e2e/core-loop.spec.ts` (**Playwright**)

## Dependencies

008.

## Acceptance

- All four actions work against the API and reflect immediately in the UI.
- Add validates bad/duplicate input; remove confirms; errors toast.

## Tests (critical paths)

- Add-repo modal shows the preview, then confirm triggers the track mutation. — **Vitest browser (functional)**
- Remove requires confirmation, then triggers untrack. — **Vitest browser (functional)**
- Mark seen clears the unseen indicator. — **Vitest browser (functional)**
- Refresh (single + global) triggers a refetch; failures toast. — **Vitest browser (functional)**
- Core demo loop: add repo → see latest release → mark seen → indicator clears. — **Playwright e2e** (the one minimal happy path)

## Alignment review

- **Requirements:** add (modal+preview), remove (confirm), mark seen
  (low-friction), refresh (single+global). ✓
- **Not over-constrictive:** libraries and cache tactics deferred; only the
  friction model (which action gets a modal) is fixed (explicit UX decision). ✓
- **PRD conformance:** pure FE over the existing GraphQL contract. ✓
