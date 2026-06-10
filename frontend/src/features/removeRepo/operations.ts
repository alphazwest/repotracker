import { gql, type TypedDocumentNode } from '@apollo/client';

/** untrackRepo — removes the link; returns Boolean. List membership changes. */
export const UNTRACK_REPO = gql`
  mutation UntrackRepo($repoId: ID!) {
    untrackRepo(repoId: $repoId)
  }
` as TypedDocumentNode<UntrackRepoData, UntrackRepoVariables>;

export interface UntrackRepoVariables {
  repoId: string;
}

export interface UntrackRepoData {
  untrackRepo: boolean;
}
