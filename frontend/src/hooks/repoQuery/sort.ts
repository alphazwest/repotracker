import type { Repo, SortKey, SortState } from '@/types';

/** Default ordering: unseen repos first, then latest release date descending. */
export const DEFAULT_SORT: SortState = {
  key: 'latestRelease',
  direction: 'desc',
};

/** Numeric ms timestamp for a sort key's date, or null when absent. */
const dateMs = (iso: string | null): number | null => {
  if (!iso) {
    return null;
  }
  const ms = new Date(iso).getTime();
  return Number.isNaN(ms) ? null : ms;
};

interface KeyComparison {
  /** Ordered value (-1/0/1 or numeric delta) to scale by the direction. */
  delta: number;
  /**
   * Direction-independent override: non-zero forces an order regardless of
   * asc/desc (used to keep missing dates trailing). Zero means "use delta".
   */
  pinned: number;
}

/**
 * Compare two repos by a single key. Strings compare case-insensitively;
 * missing dates are pinned last so a repo with no release/sync never leapfrogs
 * real values when sorting ascending.
 */
const compareByKey = (a: Repo, b: Repo, key: SortKey): KeyComparison => {
  switch (key) {
    case 'name':
      return {
        delta: `${a.owner}/${a.name}`.localeCompare(
          `${b.owner}/${b.name}`,
          undefined,
          { sensitivity: 'base' },
        ),
        pinned: 0,
      };
    case 'stars':
      return { delta: a.stars - b.stars, pinned: 0 };
    case 'forks':
      return { delta: a.forks - b.forks, pinned: 0 };
    case 'watchers':
      return { delta: a.watchers - b.watchers, pinned: 0 };
    case 'latestRelease':
    case 'lastSynced': {
      const pick = (r: Repo) =>
        key === 'latestRelease'
          ? dateMs(r.latestReleasePublishedAt)
          : dateMs(r.lastSyncedAt);
      const av = pick(a);
      const bv = pick(b);
      if (av === null && bv === null) {
        return { delta: 0, pinned: 0 };
      }
      if (av === null) {
        return { delta: 0, pinned: 1 };
      }
      if (bv === null) {
        return { delta: 0, pinned: -1 };
      }
      return { delta: av - bv, pinned: 0 };
    }
    default:
      return { delta: 0, pinned: 0 };
  }
};

/**
 * Sort a copy of `repos` by the chosen key/direction, with unseen repos kept
 * ahead of seen ones (the watchlist's primary signal). A pinned comparison
 * (missing dates) ignores the direction flip so blanks always trail.
 */
export const sortRepos = (repos: Repo[], sort: SortState): Repo[] => {
  const factor = sort.direction === 'asc' ? 1 : -1;
  return [...repos].sort((a, b) => {
    if (a.unseen !== b.unseen) {
      return a.unseen ? -1 : 1;
    }
    const { delta, pinned } = compareByKey(a, b, sort.key);
    return pinned !== 0 ? pinned : delta * factor;
  });
};
