# AGENTS.md

Project-wide guidance for agents working in this repository.

# Directives

- **TDD.** Implement test-first: write the test that asserts the intended
  behavior, implement the code, then run it to confirm the assertion passes.

# Architecture

## Separation of concerns

Each module owns one responsibility. Code is organized by concern, not by
incidental grouping.

## Backend layering

`API (GraphQL) → BAL (business logic) → DAL (data)`. Layers communicate via
**DTOs** — plain typed objects, never live ORM instances.

- **DAL** is the only layer that touches the ORM (Prisma); it returns DTOs.
- **BAL** holds all business rules; it is transport- and storage-agnostic
  (consumes/produces DTOs, takes a `userId`). Logic lives here, written once.
- **API** (resolvers) is thin: parse/validate input, call the BAL, map DTOs to
  schema types. No business logic in resolvers.
- The sync job is another thin caller of the BAL — sync logic is shared with the
  refresh path, never duplicated.

## Frontend concentration of concern

Component-scoped code lives with the component
(`Component/Component.tsx`, `hooks.ts`, `types.ts`, `constants.ts`, `index.ts`),
exposed via barrel exports. Cross-cutting code is hoisted (`src/hooks/`,
`src/lib/`, `src/theme/`, `src/types.ts`, `src/constants.ts`). A concern starts
as a single file and refactors into a directory as it grows.

## Typing & reuse

Everything is typed, frontend and backend. Prefer named prop/param interfaces
over inline typing. No duplicated logic; design for reuse across layers.

## Stack & layout

Node + TypeScript backend (Apollo Server, Prisma/Postgres, Octokit) in
`/backend`; React + TypeScript (Vite), MUI, Apollo Client in `/frontend`
(`frontend/src`). This stack is fixed.

# Testing Philosophy

We test critical paths, not coverage. A test exists to assert an
acceptance-defining behavior. If a test would not protect a critical path, we
don't write it.

## Layers

Three tools, each with a distinct job:

- **Vitest — unit (backend, critical only).** Pure logic and rules: the query
  `where`-builder, DTO mapping, the unseen computation, GitHub
  response→DTO mapping and URL parsing, business-rule services. Prisma and
  Octokit are mocked or run against a disposable test DB. Written only where the
  logic branches or carries a rule — not for thin pass-throughs.

- **Vitest (jsdom) — functional (frontend, predominant).** The bulk of the
  suite. Render components and features in a jsdom environment and assert
  behavior against the user-facing contract: what renders, what an interaction
  does, how empty/loading/error/unseen states present. GraphQL is mocked at the
  client boundary. This layer captures scope — most of what the app promises is
  verified here.

- **Playwright — e2e (minimal, critical UX only).** A few full-stack happy-path
  journeys through the real UI against a real backend. Reserved for the core
  demo loop; not for edge cases or breadth.

## Selectivity

- **Critical path** = a behavior whose failure breaks the product's core
  promise: track a repo, see its latest release version/date, mark seen, see the
  unseen indication, refresh/sync.
- Prefer one functional (Vitest) test exercising a real flow over many shallow
  unit tests.
- Don't test framework behavior, generated code, or trivial pass-throughs.
- Backend logic worth a unit test is logic with branching or rules; mappers and
  thin resolvers are covered by the layer's functional/integration test rather
  than a unit test each.

## Location

- Frontend tests colocate with their concern
  (`Component/Component.test.tsx`, hook tests beside the hook), per
  concentration-of-concern.
- Backend tests mirror the layer they cover (DAL, services, github, resolvers).
- Playwright specs live in `frontend/test/`.

## Out of scope

- **Storybook / component-level design testing.** Purposefully excluded given
  project scope. Component behavior is covered by Vitest browser functional
  tests; isolated visual/design-state cataloguing (Storybook, visual
  regression) is not part of this project.
