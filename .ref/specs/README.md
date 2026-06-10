# Workstream — RepoTracker

Specs are sequenced by dependency. Each is intentionally high-level: it states
the concern and the architectural guardrails, and defers implementation detail
to the implementer.

## Architecture guardrails (apply to every spec)

Architecture philosophy, layering, concentration-of-concern, typing/reuse, and
the fixed stack are canonical in `/AGENTS.md` (imported via `CLAUDE.md`). Every
spec inherits them. Tooling conventions (ESLint/Prettier Airbnb, 2-space,
90-col, prop interfaces) are owned by spec 000.

## Cross-cutting concerns (ownership)

Two PRD non-functional requirements span multiple specs; ownership is split so
nothing falls through:

- **Error handling / graceful GitHub-API failure.** 003 owns backend resilience
  (rate-limit throttling, retry, not-found as typed result); 005 owns typed
  GraphQL errors + input validation; 008 surfaces *sync* failures via the
  sync-status badge + the list error state; 009 surfaces *action* failures
  (refresh/add/remove) via toasts and inline add-modal validation.
- **Client-side caching.** 007 owns the Apollo cache config + the post-mutation
  update convention; 009 and 010 apply it.

## Specs

| #   | Spec                          | Layer        |
|-----|---------------------------------|--------------|
| 000 | Project setup & config          | Infra        |
| 001 | Project scaffolding             | Infra        |
| 002 | Database schema & DAL           | Backend      |
| 003 | GitHub integration              | Backend      |
| 004 | Business logic (BAL)            | Backend      |
| 005 | GraphQL API                     | Backend      |
| 006 | Sync job                        | Backend      |
| 007 | Frontend scaffolding & theme    | Frontend     |
| 008 | Repo list & views               | Frontend     |
| 009 | Repo interactions               | Frontend     |
| 010 | Search, filter & pagination     | Frontend     |
| 011 | Docs & demo data                | Delivery     |

Source of truth: `../prd.md` (product) and `../techdesign.md` (technical).

## Sequencing & parallelization

Two infra gates run first and block everything:

```
000 ─▶ 001 ─┬─▶ Backend chain
            └─▶ Frontend chain
```

After 001, the backend and frontend chains run **fully in parallel** — the
frontend mocks GraphQL at the client boundary until 005 lands, so it never
blocks on the backend.

```
Backend:   002 ─▶ 003 ─▶ 004 ─▶ ┬─▶ 005
                                 └─▶ 006

Frontend:  007 ─▶ 008 ─▶ ┬─▶ 009
                         └─▶ 010

Delivery:  011  (after both chains — documents the finished system)
```

- **Sequential gates:** 000 → 001.
- **Within backend:** 002 → 003 → 004 are sequential (each builds on the prior
  layer); 005 and 006 both depend on 004 and can run concurrently.
- **Within frontend:** 007 → 008 are sequential; 009 and 010 both depend on 008
  and can run concurrently.
- **Across chains:** backend (002–006) and frontend (007–010) are independent
  after 001.
- **Last:** 011.

## File ownership & parallelization

Each spec declares a `## Files` section: **owns (creates)** vs. **touches**.
To run specs concurrently without collisions, treat "owns" as exclusive.

A few files are **shared composition roots** — multiple specs append wiring to
them. Keep edits there append-only and small; coordinate if two land at once:

- `/backend/src/index.ts` — server boot; 005 wires Apollo, 006 wires the schedule.
- `/frontend/src/main.tsx` — 007 wraps providers.
- `*/package.json` — most specs add dependencies/scripts.
- `/frontend/src/lib/apollo/operations/repos.ts` — 008 owns the `trackedRepos`
  document; 010 extends it with search/filter/page args.

Cross-spec seam: 008's `RepoCard` exposes an action slot that 009's
mark-seen / per-repo controls fill — so the two don't edit the same component.
