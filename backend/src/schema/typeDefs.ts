/**
 * GraphQL schema (SDL) for the RepoTracker.
 *
 * The frontend is built against this exact contract. `unseen` is the only
 * computed field; the latest-release values are denormalized columns, so there
 * is no per-row release fetch and no N+1. `unseen` and the `unseenOnly` filter
 * are resolved in the root query (joining the user's seen state), not per row.
 */
export const typeDefs = /* GraphQL */ `
  scalar DateTime

  enum SyncStatus {
    SUCCESS
    ERROR
    PENDING
  }

  enum RepoPreviewStatus {
    VALID
    INVALID_URL
    NOT_FOUND
    ALREADY_TRACKED
  }

  type RepoPreview {
    status: RepoPreviewStatus!
    owner: String
    name: String
  }

  type Language {
    name: String!
    color: String
  }

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
    latestReleaseVersion: String
    latestReleasePublishedAt: DateTime
    latestReleaseUrl: String
    unseen: Boolean!
    lastSyncedAt: DateTime
    lastSyncStatus: SyncStatus
  }

  type PageInfo {
    page: Int!
    pageSize: Int!
    hasNextPage: Boolean!
  }

  type RepoConnection {
    nodes: [Repo!]!
    totalCount: Int!
    pageInfo: PageInfo!
  }

  input RepoFilter {
    unseenOnly: Boolean
    languages: [String!]
  }

  type Query {
    trackedRepos(
      search: String
      filter: RepoFilter
      page: Int = 1
      pageSize: Int = 10
    ): RepoConnection!
    previewRepo(url: String!): RepoPreview!
  }

  type Mutation {
    trackRepo(url: String!): Repo!
    untrackRepo(repoId: ID!): Boolean!
    markSeen(repoId: ID!): Repo!
    refreshRepo(repoId: ID!): Repo!
    refreshAll: [Repo!]!
  }
`;
