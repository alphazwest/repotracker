import { gql, type TypedDocumentNode } from '@apollo/client';
import type { RepoConnection } from '@/types';
import { REPO_FIELDS } from './fragments';

/**
 * The tracked-repos list query. One fetch pulls the entire watchlist
 * (`pageSize` sized to cover it); search, filter, sort, and pagination are
 * derived client-side. `totalCount`/`pageInfo` accompany the connection.
 */
export const TRACKED_REPOS = gql`
  ${REPO_FIELDS}
  query TrackedRepos($pageSize: Int) {
    trackedRepos(pageSize: $pageSize) {
      nodes {
        ...RepoFields
      }
      totalCount
      pageInfo {
        page
        pageSize
        hasNextPage
      }
    }
  }
` as TypedDocumentNode<TrackedReposData, TrackedReposVariables>;

export interface TrackedReposVariables {
  pageSize?: number;
}

export interface TrackedReposData {
  trackedRepos: RepoConnection;
}
