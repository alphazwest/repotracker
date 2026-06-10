# PRD — RepoTracker

## Overview

A web application for tracking GitHub repositories and their release activity.
Users add repositories, see the latest release per repo, and mark releases as
"seen" so new activity stands out. A backend keeps release data current via
on-demand refresh and periodic background sync.

The value: replace ad-hoc checking of many repos' release pages with a single
dashboard that surfaces only what's new since you last looked.

---

## Requirements

### Functional

- Add a GitHub repository to track (by URL).
- List tracked repositories.
- Show latest release per repo: repo name, description, version, release date.
- Mark a release as "seen"; persist seen status per release.
- Visually distinguish repos with unseen updates.
- Manual "Refresh" to fetch latest data from GitHub on demand.
- Periodic background sync to capture new releases.

### Non-Functional

- All frontend and backend code fully typed (TypeScript).
- No duplicated logic; modular, reusable design across FE and BE.
- Production-quality: error handling, input validation, graceful GitHub API failure.
- Persist all state in PostgreSQL; data survives restarts.
- Client-side caching of GraphQL data.

_Stretch goals are consolidated in the footer._

---

## Data Model (Concepts)

The core concepts the system tracks:

- **User** — someone using the app. Has their own list of tracked repos.
- **Repo** — a GitHub repository, stored once globally. If five users track
  React, there is still only one React entry. Carries display metadata: author
  (owner + avatar), stars, watchers, forks, languages.
- **Tracked Repo** — the link between a user and a repo they follow.
- **Latest Release** — each repo carries its most recent release: ★ **version**
  (the key metric) and release date. We store only the latest, not a history.

**Fields (conceptual stub)**

Not a schema — just the notable fields so we don't lose track of what each
concept carries. ★ marks the key field.

- **User** — identity (name / handle).
- **Repo** — owner/name, description, url, author (owner url + avatar); metadata:
  stars, watchers, forks, languages; ★ **latest release version** + release date;
  sync state (last synced, status).
- **Tracked Repo** — which user, which repo; added date; seen marker (the
  version last acknowledged).

**Seen / unseen**

Each user keeps a marker on each repo they track, recording the release version
they last acknowledged. A repo shows as "unseen" when its latest release differs
from that marker. Marking a repo as seen sets the marker to the current latest.

**Tradeoff — latest-only, no history**

We store only each repo's latest release, not a timeline. The seen marker is
just the version a user last acknowledged. This answers the product question
("which repos have something new?") with the least machinery. We forgo per-
release history and any changelog/detail view — neither is required. Adding a
release-history table later would enable both without disturbing this model.

---

## Frontend

A single primary screen for managing and scanning tracked repos. The goal:
unseen updates stand out at a glance.

**Tenancy:** single user for the demo. The data model supports multiple users,
but there is no auth flow — the app operates as one implicit user.

**Layout**

- **Top toolbar / menu** — app-level actions (Add repo, global Refresh, view
  toggle) plus an **unseen count** that doubles as a quick-filter for unseen repos.
- **Sub-toolbar** — search / filter over the tracked list.
- **Main content** — the tracked repos, in one of two togglable views.
- **Pagination** — at the bottom of the content area.

**Two views (togglable)**

- **List view** — compact rows.
- **Card view** — larger cards.
- (A list row is technically a card variant; same content, different density.)

Both show **only the latest release** per repo. The release **version** (with
its date) is the primary signal — it's the headline of each card and what
drives the seen/unseen state. Remaining fields are supporting context:

- Latest release: **version + date** (primary)
- Name, description
- Seen / unseen indicator (unseen repos are visually distinct)
- Stars, watchers, forks
- Languages — top 3, remainder truncated
- **Sync freshness** — a badge showing how recently this repo was synced
  (e.g. "synced 2h ago").

**Interactions**

- **Add a repo** — opens a modal to enter the repo and review a read-only
  preview (name, description, latest release, metadata) before confirming.
- **Mark as seen** — low-friction, inline action on a repo; no modal, minimal disruption.
- **Remove a repo** — requires a confirmation modal.
- **Refresh** — both per-repo (single) and global (refresh all).
- **Search / filter** — both operate over all displayed fields: name,
  description, languages, and metadata (stars, watchers, forks).
- **Refresh feedback** — busy indication during a refresh: a spinner on the
  acting control (per-repo or global) and a toast on completion or failure.

**Feedback**

- Action results (add, remove, refresh, errors) surface as **toasts**.

**Data layer & freshness**

- The frontend talks to the backend over GraphQL via **Apollo Client**. Because
  the backend is GraphQL, a GraphQL-native client keeps the screen consistent
  with the least hand-written code: when an action changes a repo (mark seen,
  refresh), the client recognizes that repo by identity and updates it in place
  across every view automatically, rather than us manually re-syncing the list.
- Cached data renders instantly on load, then updates as fresh results arrive
  (client-side caching is a requirement, met by the client's built-in cache).

**Pagination**

- Page-based, at the bottom of the content area.
- Engages only past 10 repos; below that the full list shows on one page.

**States**

- Empty (no repos tracked) — prompt to add the first.
- Loading / refreshing.
- Error (invalid URL, repo not found, GitHub unreachable, duplicate add).
- Seen vs. unseen — the core visual distinction.

---

## Backend

Node.js + GraphQL (Apollo Server) over PostgreSQL. It stores users, globally
deduped repos (each carrying its latest release and metadata), and every user's
tracked-repo seen markers. It fetches repo data from GitHub via Octokit, maps it
to the app's own types, and exposes everything through the GraphQL API. The
layering — API → business logic → data access — keeps business rules in one
place so the sync job and the resolvers share them.

Schema, contracts, and mechanics are detailed in `techdesign.md`.

---

## Sync-Service

Keeps each repo's latest release and metadata current. Runs in-process as part
of the backend (a scheduled job), not a separate service.

- **On-demand refresh** — triggered via GraphQL mutation: single repo or all.
- **Periodic background sync** — scheduled poll sweeping all tracked repos.
- **What it does** — fetches repo metadata + latest release, overwrites the repo
  record in place. Idempotent; a "new" release just means the latest version
  changed.
- **Resilience** — rate-limit aware, with backoff/retry on transient failures.

A separate worker process and event-driven sync are the production evolution
(see Stretch / techdesign).

---

## Stretch Goals

_All non-MVP scope, parked here. To prioritize later._

**Product / Functional**
- Per-user accounts (GitHub OAuth); tracked repos and seen status scoped to user.
- Detailed release view: notes + commit history.
- Sort repos (update status, date, name).
- In-app / desktop notifications for new updates.
- Mark-all-seen.

**Frontend**
- Responsive / mobile-functional UI.
- (Detailed release view, sort controls, notifications — see Product above.)

**Backend**
- Authentication (GitHub OAuth).
- GitHub API rate-limit awareness and backoff.
- Mock data source for offline development.

**Sync**
- Webhook-driven sync for real-time updates.
