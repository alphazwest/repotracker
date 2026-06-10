import { gql } from '@apollo/client';

/**
 * The full set of `Repo` fields the UI renders. Mutations that return a `Repo`
 * (`trackRepo`, `markSeen`, `refreshRepo`, `refreshAll`) reuse this so the
 * normalized cache receives every field the views read — including `id`, which
 * is what lets Apollo patch the right entity in place.
 */
export const REPO_FIELDS = gql`
  fragment RepoFields on Repo {
    id
    owner
    name
    description
    url
    authorUrl
    avatarUrl
    stars
    watchers
    forks
    languages {
      name
      color
    }
    latestReleaseVersion
    latestReleasePublishedAt
    latestReleaseUrl
    unseen
    lastSyncedAt
    lastSyncStatus
  }
`;
