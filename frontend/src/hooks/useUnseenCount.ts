import { useQuery } from '@apollo/client/react';
import { TRACKED_REPOS } from '../lib/apollo/operations/repos';
import { FETCH_PAGE_SIZE } from './repoQuery';

/**
 * Number of tracked repos with an unseen release — the single source of truth
 * for the header bell and the mobile menu.
 *
 * Derived from the same cached tracked-repo list `useRepoQuery` fetches (same
 * query + variables, `cache-first`), so it adds no network round-trip and
 * recomputes automatically whenever a mutation patches a repo's `unseen` flag
 * in the normalized cache — no `refetchQueries` wiring anywhere.
 */
export const useUnseenCount = (): number => {
  const { data } = useQuery(TRACKED_REPOS, {
    variables: { pageSize: FETCH_PAGE_SIZE },
    fetchPolicy: 'cache-first',
  });
  return data?.trackedRepos.nodes.filter((node) => node.unseen).length ?? 0;
};
