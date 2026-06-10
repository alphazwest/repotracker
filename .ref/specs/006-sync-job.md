# 006 — Sync Job

> **Read first:** @README.md — workstream plan, sequencing, file ownership, and architecture guardrails.

## Concern

Keep repo data current on a schedule, reusing the same sync business logic the
refresh mutations call. Runs in-process (no separate service).

## Scope (high-level)

- A scheduled job (e.g. `node-cron`) in the server entrypoint that periodically
  syncs all tracked repos.
- Batch concurrency bounded (e.g. `p-limit(2)`) so GitHub isn't hammered.
- Shares the BAL sync service with `refreshRepo` / `refreshAll` — no duplicated
  sync logic.
- Configurable interval; safe to run alongside on-demand refreshes (syncs are
  full-overwrite, so concurrent runs at worst redo work).

## Defer to implementer

Scheduler library, interval default, logging/observability depth.

## Files

Owns (creates), under `/backend/src/jobs/`:
- `syncSchedule.ts` — `node-cron` setup calling `services/sync.ts`
- `index.ts`

Touches:
- `/backend/src/index.ts` — start the schedule (append).

Tests:
- `/backend/src/jobs/syncSchedule.test.ts`

## Dependencies

004 (005 for the on-demand trigger path).

## Acceptance

- On schedule, tracked repos' latest release + metadata update without manual
  action.
- Manual refresh and the schedule exercise the same code path.

## Tests (critical paths)

- A sync overwrites a repo's `latestRelease*` + metadata from the integration
  result. — **Jest unit**
- Idempotent: re-running a sync yields the same row. — **Jest unit**
- Scheduled and on-demand (`refreshAll`) paths invoke the same sync service. — **Jest unit**

(GitHub integration mocked.)

## Alignment review

- **Requirements:** satisfies "periodic background sync" + "manual refresh"
  (single & global). ✓
- **Not over-constrictive:** scheduler/interval deferred; only "in-process,
  shared logic, bounded concurrency" is fixed by design. ✓
- **PRD conformance:** Node/TS in-process; separate worker is parked as stretch.
  ✓
