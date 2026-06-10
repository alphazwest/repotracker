import { gql, type TypedDocumentNode } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import type { Repo } from '@/types';
import { REPO_FIELDS } from '@/lib/apollo/operations/fragments';
import { TRACKED_REPOS } from '@/lib/apollo/operations/repos';
import { useToast } from '@/lib/toast';

/**
 * refreshRepo — one-off sync of a single repo; returns the updated Repo.
 * Patches by `id` in place.
 */
export const REFRESH_REPO = gql`
  ${REPO_FIELDS}
  mutation RefreshRepo($repoId: ID!) {
    refreshRepo(repoId: $repoId) {
      ...RepoFields
    }
  }
` as TypedDocumentNode<RefreshRepoData, RefreshRepoVariables>;

export interface RefreshRepoVariables {
  repoId: string;
}

export interface RefreshRepoData {
  refreshRepo: Repo;
}

/**
 * refreshAll — batch sync of the user's tracked repos. Returns the updated
 * Repos; ordering/unseen counts can change, so callers refetch the list + count.
 */
export const REFRESH_ALL = gql`
  ${REPO_FIELDS}
  mutation RefreshAll {
    refreshAll {
      ...RepoFields
    }
  }
` as TypedDocumentNode<RefreshAllData>;

export interface RefreshAllData {
  refreshAll: Repo[];
}

/** Per-repo refresh. refreshRepo returns the updated Repo; cache patches by id. */
export const useRefreshRepo = () => {
  const toast = useToast();
  const [mutate, state] = useMutation(REFRESH_REPO);

  const refreshRepo = async (repoId: string) => {
    try {
      await mutate({ variables: { repoId } });
      toast.success('Repository refreshed.');
    } catch {
      toast.error('Refresh failed. GitHub may be unreachable or rate-limited.');
    }
  };

  return { refreshRepo, loading: state.loading };
};

/**
 * Global refresh. refreshAll can change ordering and add releases across the
 * watchlist, so it refetches the list; the derived unseen count recomputes from
 * the refreshed nodes.
 */
export const useRefreshAll = () => {
  const toast = useToast();
  const [mutate, state] = useMutation(REFRESH_ALL, {
    refetchQueries: [TRACKED_REPOS],
  });

  const refreshAll = async () => {
    try {
      await mutate();
      toast.success('All repositories refreshed.');
    } catch {
      toast.error('Refresh failed. GitHub may be unreachable or rate-limited.');
    }
  };

  return { refreshAll, loading: state.loading };
};
