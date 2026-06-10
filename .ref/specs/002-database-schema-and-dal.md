# 002 — Database Schema & Data Access Layer

> **Read first:** @README.md — workstream plan, sequencing, file ownership, and architecture guardrails.

## Concern

Model persistence and provide the **only** layer that touches the ORM. Expose
data to the rest of the backend as DTOs, never as live Prisma instances.

## Schema (models — field & relationship level)

Every model has a UUID primary key (`String @id @default(uuid()) @db.Uuid`,
native Postgres `uuid`). **All foreign keys and relations reference these UUID
fields.** Datatypes are Prisma scalars; adjust names only if a
linter/convention requires it.

### `User`
| Field     | Type      | Attributes                          | Notes                       |
|-----------|-----------|-------------------------------------|-----------------------------|
| id        | String    | `@id @default(uuid()) @db.Uuid`     | UUID PK                     |
| handle    | String    | `@unique`                           | display/login handle        |
| createdAt | DateTime  | `@default(now())`                   |                             |
| trackedRepos | UserRepo[] | relation                         | repos this user tracks      |

### `Repo` — globally deduped, one row per GitHub repo
| Field                    | Type     | Attributes                      | Notes                                          |
|--------------------------|----------|---------------------------------|------------------------------------------------|
| id                       | String   | `@id @default(uuid()) @db.Uuid` | UUID PK                                         |
| githubId                 | Int      | `@unique`                       | stable GH id; survives owner/name renames      |
| owner                    | String   |                                 | GitHub owner/org login                         |
| name                     | String   |                                 | repo name                                      |
| description              | String?  |                                 | nullable                                       |
| url                      | String   |                                 | repo `html_url`                                |
| authorUrl                | String   |                                 | owner `html_url`                               |
| avatarUrl                | String?  |                                 | owner avatar                                   |
| stars                    | Int      | `@default(0)`                   | `stargazers_count`                             |
| watchers                 | Int      | `@default(0)`                   | `subscribers_count` (true watchers, not alias) |
| forks                    | Int      | `@default(0)`                   | `forks_count`                                  |
| languages                | Json     | `@default("[]")`                | top 3: `[{ name, color }]`                     |
| latestReleaseVersion     | String?  |                                 | ★ key metric; null if no releases              |
| latestReleasePublishedAt | DateTime?|                                 | nullable                                       |
| latestReleaseUrl         | String?  |                                 | nullable                                       |
| lastSyncedAt             | DateTime?|                                 | drives freshness badge                         |
| lastSyncStatus           | SyncStatus? |                              | enum (below)                                   |
| createdAt                | DateTime | `@default(now())`               |                                                |
| updatedAt                | DateTime | `@updatedAt`                    |                                                |
| trackedBy                | UserRepo[] | relation                      | users tracking this repo                       |

Constraints: `@@unique([owner, name])` and `githubId @unique` — both enforce
global dedupe (githubId is the rename-stable key).

**Persisted fields:** the columns above are the fields the app uses. GitHub
exposes many more; additional fields are not persisted — a feature that needs
one adds the column.

### `UserRepo` — tenancy edge + seen watermark
| Field                  | Type     | Attributes                          | Notes                                  |
|------------------------|----------|-------------------------------------|----------------------------------------|
| id                     | String   | `@id @default(uuid()) @db.Uuid`     | UUID PK                                |
| userId                 | String   | `@db.Uuid`, relation FK → `User.id` | `onDelete: Cascade`                    |
| repoId                 | String   | `@db.Uuid`, relation FK → `Repo.id` | `onDelete: Cascade`                    |
| addedAt                | DateTime | `@default(now())`                   |                                        |
| lastSeenReleaseVersion | String?  |                                     | watermark; set to latest at track time |

Constraint: `@@unique([userId, repoId])` — a user tracks a repo at most once.
Relations: `user User @relation(fields: [userId], references: [id])`,
`repo Repo @relation(fields: [repoId], references: [id])` — FK columns are
UUIDs referencing the parents' UUID PKs.

### `SyncStatus` (enum)
`SUCCESS | ERROR | PENDING`

**Unseen rule (not stored):** a tracked repo is unseen when
`repo.latestReleaseVersion != null && repo.latestReleaseVersion !=
userRepo.lastSeenReleaseVersion`.

## Scope (beyond the schema)

- Migrations and a typed Prisma client factory.
- A **DAL** module exposing intent-revealing functions (find/list/upsert/update)
  that return **DTOs** — plain typed shapes mapped from Prisma rows.
- A single shared `where`-builder used by both list and count queries (so
  pagination totals can't drift).

## Defer to implementer

DTO shape specifics and mapping-helper style; indexing beyond the documented
unique/PK; whether `lastSyncStatus` carries an error message column; seed
mechanics (covered in 011).

## Files

Owns (creates):
- `/backend/prisma/schema.prisma`
- `/backend/src/prisma.ts` — PrismaClient factory
- `/backend/src/dto/index.ts` — DTO types (cross-layer contract)
- `/backend/src/dal/repos.ts`, `/backend/src/dal/users.ts`,
  `/backend/src/dal/where.ts`, `/backend/src/dal/index.ts`

Tests:
- `/backend/src/dal/where.test.ts`, `/backend/src/dal/repos.test.ts`

## Dependencies

001.

## Acceptance

- Migrations apply cleanly to a fresh DB.
- DAL returns DTOs; no Prisma type leaks past this layer.

## Tests (critical paths)

- `where`-builder: search + filter (`languages`, `unseenOnly`) + pagination
  produce the expected Prisma `where`; list and count consume the same one. — **Jest unit**
- DTO mapping: Prisma row → DTO; no ORM types leak past the DAL. — **Jest unit**
- Unseen rule: latest version vs. watermark, including null cases. — **Jest unit**

## Alignment review

- **Requirements:** persists tracked repos, latest release, per-user seen state
  across sessions. ✓
- **Not over-constrictive:** the schema is fixed to field/relationship level by
  request (it's the shared contract every backend layer builds on); DTO shapes,
  mapping helpers, and extra indexing remain open. ✓
- **PRD conformance:** PostgreSQL + Prisma as specified. ✓
