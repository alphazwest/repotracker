import { useMemo } from 'react';
import { useQuery } from '@apollo/client/react';
import { TRACKED_REPOS } from '@/lib/apollo/operations/repos';
import type { FilterModel, Repo, SortState } from '@/types';
import { matchesFilter, matchesSearch } from './filter';
import { sortRepos } from './sort';

/** Single fetch covers the full watchlist; client owns filter/sort/page. */
export const FETCH_PAGE_SIZE = 200;

export interface UseRepoQueryArgs {
  search: string;
  filter: FilterModel;
  sort: SortState;
  page: number;
  pageSize: number;
}

export interface UseRepoQueryResult {
  /** Repos on the current page (after search + filter + sort + slice). */
  pageRepos: Repo[];
  /** Count after search + filter, before pagination — drives Pagination + footer. */
  filteredCount: number;
  /** Total tracked repos returned by the server (unfiltered). */
  totalCount: number;
  loading: boolean;
  error: boolean;
}

/**
 * The list data layer. Fetches every tracked repo in one query, then applies
 * the free-text search, the filter-builder model, the sort, and pagination
 * entirely client-side. Filtering at this scale (a personal watchlist) is cheap
 * and unlocks the rich, multi-field filter builder without server round-trips.
 */
export const useRepoQuery = ({
  search,
  filter,
  sort,
  page,
  pageSize,
}: UseRepoQueryArgs): UseRepoQueryResult => {
  const { data, loading, error } = useQuery(TRACKED_REPOS, {
    variables: { pageSize: FETCH_PAGE_SIZE },
  });

  const allRepos = useMemo(
    () => data?.trackedRepos.nodes ?? [],
    [data],
  );

  const filtered = useMemo(
    () =>
      allRepos.filter(
        (repo) => matchesSearch(repo, search) && matchesFilter(repo, filter),
      ),
    [allRepos, search, filter],
  );

  const sorted = useMemo(() => sortRepos(filtered, sort), [filtered, sort]);

  const pageRepos = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sorted.slice(start, start + pageSize);
  }, [sorted, page, pageSize]);

  return {
    pageRepos,
    filteredCount: filtered.length,
    totalCount: data?.trackedRepos.totalCount ?? allRepos.length,
    loading,
    error: !!error,
  };
};
