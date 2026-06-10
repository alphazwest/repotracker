import { gql, type TypedDocumentNode } from '@apollo/client';
import type { Repo } from '@/types';
import { REPO_FIELDS } from '@/lib/apollo/operations/fragments';

/**
 * markSeen — sets the watermark to the repo's current latest version and
 * returns the updated Repo (incl. `unseen`). Apollo patches the entity by `id`;
 * no refetch needed.
 */
export const MARK_SEEN = gql`
  ${REPO_FIELDS}
  mutation MarkSeen($repoId: ID!) {
    markSeen(repoId: $repoId) {
      ...RepoFields
    }
  }
` as TypedDocumentNode<MarkSeenData, MarkSeenVariables>;

export interface MarkSeenVariables {
  repoId: string;
}

export interface MarkSeenData {
  markSeen: Repo;
}
