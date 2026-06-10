# Tech Design — RepoTracker

Elaborates the PRD into implementable design. Bias: minimal complexity that
still demonstrates production patterns. Where a pattern is deliberately
simplified for scope, the production evolution is noted inline as
**→ Prod:**.

---

## Stack

| Layer    | Choice                                                        |
|----------|--------------------------------------------------------------|
| Backend  | Node + TypeScript, Apollo Server (GraphQL), Prisma (Postgres) |
| GitHub   | Octokit (`@octokit/core` + throttling plugin)                |
| Frontend | React + TypeScript, MUI, Apollo Client                       |
| Sync     | In-server, cron-scheduled (`node-cron`), shares the service layer |

---

## Repository Structure

One server process. A scheduled job and the GraphQL mutations call the same
sync service — no separate process, no shared-package build setup.

```
backend/
  src/
    index.ts              # composition root: boot config, wires server + cron
    server.ts             # Apollo Server factory (createApolloServer/startServer)
    schema/               # GraphQL typeDefs
    resolvers/            # thin resolvers -> call services/ (API layer)
    services/             # BAL: track/untrack/markSeen, list/where builder, sync
      repos.ts
      sync.ts             # syncRepo* — called by cron AND refreshRepo/refreshAll
      errors.ts           # typed business-rule errors
    dal/                  # data access layer — only layer touching Prisma; returns DTOs
    dto/                  # DTO types + mappers crossing layer boundaries
    github/               # configured Octokit + map GitHub data -> DTOs
    graphql/              # DTO -> GraphQL schema-type mappers
    jobs/                 # node-cron schedule (thin caller of services/sync)
    prisma.ts             # PrismaClient factory
  prisma/
    schema.prisma
frontend/                 # React/TS (Vite) — see Frontend section
  src/
```

**Principle:** the cron job and the resolvers are both thin callers of
`services/`. Business logic is written once and shared, never duplicated across
the read path and the sync path.

- **→ Prod:** the sync job runs in-process for scope. A production system would
  extract it into a separate worker (own deploy, queue-driven). Because the
  logic already lives in `services/sync.ts` behind a clean entrypoint, that
  extraction is a packaging change, not a rewrite.

---

## Backend

### Data Model (Prisma)

All ids are native Postgres UUIDs (`String @id @default(uuid()) @db.Uuid`); FK
columns are `@db.Uuid` referencing them.

```
User
  id        String  @id @default(uuid()) @db.Uuid
  handle    String  @unique
  createdAt DateTime @default(now())

Repo                       # globally deduped — one row per GitHub repo
  id          String  @id @default(uuid()) @db.Uuid
  githubId    Int     @unique          # stable GH id; survives owner/name renames
  owner       String
  name        String
  description String?
  url         String                   # repo html_url
  authorUrl   String                   # owner html_url
  avatarUrl   String?                  # owner avatar
  stars       Int     @default(0)      # stargazers_count
  watchers    Int     @default(0)      # subscribers_count (true watchers, not the stars-alias)
  forks       Int     @default(0)      # forks_count
  languages   Json    @default("[]")   # top 3: [{ name, color }]
  latestReleaseVersion     String?     # ★ key metric (tag); null if repo has no releases
  latestReleasePublishedAt DateTime?
  latestReleaseUrl         String?
  lastSyncedAt   DateTime?
  lastSyncStatus SyncStatus?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  @@unique([owner, name])

UserRepo                   # tenancy edge + seen watermark
  id                     String  @id @default(uuid()) @db.Uuid
  userId                 String  @db.Uuid   # FK -> User.id
  repoId                 String  @db.Uuid   # FK -> Repo.id
  addedAt                DateTime @default(now())
  lastSeenReleaseVersion String?   # watermark; set to latest at track time
  @@unique([userId, repoId])
```

Notes:
- **Latest release is denormalized onto `Repo`** (no separate Release table, no
  history). Sync overwrites these columns in place.
- The watermark is the **version string** the user last acknowledged. `unseen` =
  `latestReleaseVersion != null && latestReleaseVersion != lastSeenReleaseVersion`.
- **Metadata (stars/watchers/forks/languages)** are flat columns, refreshed in
  place by sync. Update `lastSyncedAt` whenever they change, or the freshness
  badge goes stale.
- **Persisted fields:** the columns above are the fields the app uses. GitHub
  exposes many more; additional fields are not persisted — a new feature adds the
  column it needs.
- **Stars** use the single canonical metric `stargazers_count`. GitHub's
  `watchers_count` is a legacy alias for stars and is **not** used. **Watchers**
  = `subscribers_count` (a genuinely distinct number), which the repo GET we
  already perform returns — no extra request.
- **→ Prod:** a `Release` history table would back a changelog/detail view.
  Out of scope here — only the latest release is needed for the seen/unseen loop.

### Tenancy

All user-scoped reads filter by `userId`. For the demo a single implicit user
(`DEMO_USER`) is used; there is no auth. The model is already multi-tenant, so
adding auth later only means populating `userId` from a session instead of a
constant.

- **→ Prod:** inject `userId` from an authenticated session; consider a Prisma
  extension that always applies the `userId` filter so a new query can't
  forget it.

### GraphQL Contract

```graphql
type Repo {
  id: ID!
  owner: String!
  name: String!
  description: String
  url: String!
  authorUrl: String!
  avatarUrl: String
  stars: Int!
  watchers: Int!
  forks: Int!
  languages: [Language!]!
  latestReleaseVersion: String        # ★ key metric; null if no releases
  latestReleasePublishedAt: DateTime
  latestReleaseUrl: String
  unseen: Boolean!                     # latest version != user's watermark
  lastSyncedAt: DateTime
  lastSyncStatus: SyncStatus
}

type RepoConnection {
  nodes: [Repo!]!
  totalCount: Int!
  pageInfo: PageInfo!          # hasNextPage, page, pageSize
}

type Query {
  trackedRepos(
    search: String
    filter: RepoFilter         # { unseenOnly: Boolean, languages: [String!] }
    page: Int = 1
    pageSize: Int = 10
  ): RepoConnection!
  previewRepo(url: String!): RepoPreview!   # validate a URL without tracking (status + parsed owner/name)
}

enum RepoPreviewStatus { VALID INVALID_URL NOT_FOUND ALREADY_TRACKED }

type RepoPreview {
  status: RepoPreviewStatus!
  owner: String
  name: String
}

type Mutation {
  trackRepo(url: String!): Repo!       # parse URL, fetch from GitHub, upsert, link to user
  untrackRepo(repoId: ID!): Boolean!
  markSeen(repoId: ID!): Repo!         # watermark = repo's current latest version (returns Repo incl. unseen)
  refreshRepo(repoId: ID!): Repo!      # one-off sync of a single repo
  refreshAll: [Repo!]!                 # batch sync of the user's tracked repos
}
```

- Pagination uses offset (`page`/`pageSize`), simple connection shape.
  Engages past 10 results.
  - **→ Prod:** cursor-based (Relay) connections to avoid deep-offset cost.
- `unseen` is the only computed field. Latest-release values are plain columns
  on `Repo`, so there is no per-row release fetch and no N+1.
- The toolbar badge / quick-filter count is derived client-side from the
  fetched tracked-repo list (`nodes.filter(n => n.unseen).length`), not a
  separate query — one source of truth that updates on any entity patch.

### Resolver footguns (load-bearing)

1. **`unseen` and the `unseenOnly` filter live in the root query, not a per-row
   resolver.** Both compare `repo.latestReleaseVersion` against the user's
   `lastSeenReleaseVersion`. Join `UserRepo` in the `trackedRepos` query and
   express `unseenOnly` in the Prisma `where`, so pagination counts stay correct.

2. **`totalCount` must reuse the exact same `where`** as the paged query
   (search + languages + unseenOnly). Build the `where` once in a shared helper
   (`services/repos.ts`) and feed both `findMany` and `count` — drift here
   silently breaks paging.

3. **`markSeen`** sets `lastSeenReleaseVersion = repo.latestReleaseVersion` in a
   single update and returns the updated `Repo` (incl. `unseen`) so Apollo's
   cache patches without a refetch.

### Track semantics

On `trackRepo`, set `lastSeenReleaseVersion` to the repo's **current latest
version** (not null). A newly tracked repo starts "seen" — the user is
acknowledging its current state, not asking to be alerted about a release that
already shipped. `unseen` flips true only when a *future* sync brings a newer
version.

### GitHub Integration

- `@octokit/core` with the official **throttling plugin** — handles primary +
  secondary rate limits and retry-after automatically.
- The `github/` module turns Octokit responses → our domain types (mapping in
  `github/map.ts`), so resolvers and sync never touch raw API shapes.

---

## Sync

`services/sync.ts`, run two ways from the same code:

- **Scheduled:** a `node-cron` job in `index.ts` sweeps all tracked repos on an
  interval.
- **On-demand:** the `refreshRepo` (one-off) and `refreshAll` (batch) mutations.

### What a sync does

For each repo: fetch repo metadata + the **latest release** from GitHub, then
overwrite the Repo row in place (`stars/watchers/forks/languages`,
`latestRelease*`, `lastSyncedAt`). No history, no upsert keys — a sync is a
plain update. Idempotent by construction: re-running produces the same row.

A user's `unseen` flips true automatically when `latestReleaseVersion` changes
and their watermark now trails it.

### Rate limiting / resilience

- Octokit throttling plugin for rate limits (primary + secondary).
- Batch sync uses **`p-limit(2)`** — never hammer GitHub.
- `p-retry` with exponential backoff for *transient* errors only (network/5xx);
  rate-limit retries are owned by the throttling plugin.

### Concurrency footgun

The cron sweep and a user `refreshRepo` can hit the same repo at once. Since each
sync is a full overwrite of independent columns, the worst case is a redundant
write, not corruption. Acceptable at this scope.

- **→ Prod:** in-process polling is the deliberate simplification. Production
  would be **event/message-driven** — a separate worker fed by a queue
  (BullMQ/Redis) or pub/sub, with per-repo locking and webhook-triggered syncs
  instead of polling.

---

## Frontend

React + TypeScript SPA. MUI for components, Apollo Client for the data layer.

### Structure — Concentration of Concern

Production-SaaS layout: code lives with the component that owns it, exposed via
barrel exports. A concern starts as a single file and refactors into a
sub-directory as it grows.

```
frontend/src/
  app/                    # provider stack + the single app shell
  components/
    RepoList/
      index.ts            # barrel — public surface only
      RepoList.tsx
      components/         # RepoCard, RepoRow, SyncDot, ...
      utils.ts  types.ts  constants.ts
    SearchFilterBar/      # search, sort, filter drawer
  features/
    addRepo/              # AddRepoModal + its hook/validation
    refresh/  repoActions/  removeRepo/
  hooks/                  # cross-cutting hooks (useRepoQuery, useLocalStorage, ...)
  lib/
    apollo/               # Apollo client config + typed operation documents
    toast/                # toast provider
  theme/                  # centralized MUI theme + mode context
  types.ts  constants.ts  # cross-cutting domain types / constants
```

### Data layer (Apollo Client)

- Single Apollo Client with the **normalized cache**. Operations live as typed
  documents (`TypedDocumentNode`) in `lib/apollo/`; components consume them
  through `useQuery` / `useMutation` with result/variable types inferred from the
  document — hand-written types, no codegen.
- **Freshness after mutations comes mostly for free.** Mutations that return the
  updated `Repo` (with its `id`) let Apollo patch the entity in the normalized
  cache automatically — `markSeen`, `refreshRepo` update in place with no manual
  wiring. Operations that change list membership or ordering
  (`trackRepo`, `untrackRepo`, `refreshAll`) declare `refetchQueries:
  [TrackedRepos]` (or update the cache directly).
- Client-caching requirement is satisfied by Apollo's normalized cache: cached
  data renders instantly, then updates as results arrive.
- Footgun: mutation responses must include `id` (and the changed fields) for the
  cache to auto-update the right entity — otherwise the UI looks stale.

### Theme / design system

- One `createAppTheme({ mode })` parameterized by `mode` (light/dark); the active
  palette and component overrides derive from it.
- `mode` lives in a **global context**, persisted to localStorage; everything
  reads from `useTheme()`. Centralized so a config change flips the whole app.
- Footgun: custom (non-MUI) components must read palette tokens from the theme,
  or they drift out of sync in dark mode.

### State

- **Global context:** theme mode (persisted). Server state is owned by the
  Apollo normalized cache, not context.
- **Local/component state** everywhere else (modals, form inputs, view toggle,
  search/filter/sort/page).

---

## Deliberate Simplifications (Summary)

| Area        | Now                                       | → Prod                                   |
|-------------|-------------------------------------------|------------------------------------------|
| Sync        | In-process cron, polling                  | Separate worker, queue/pub-sub, webhooks |
| Releases    | Latest only, denormalized on Repo         | `Release` history table + changelog view |
| Auth        | Single implicit user                      | Session-scoped `userId`, OAuth           |
| Pagination  | Offset                                    | Cursor (Relay) connections               |
| Concurrency | Full-overwrite syncs, no locks            | Per-repo locking                         |
