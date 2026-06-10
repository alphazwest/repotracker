import type { Repo, SyncStatus } from '@/types';

/**
 * Pick a readable text color (near-black or near-white) for a solid-fill chip
 * given its background, using perceived luminance. Falls back to white for a
 * missing/unparseable color.
 */
export const contrastText = (hex: string | null): string => {
  if (!hex) {
    return '#ffffff';
  }
  const value = hex.replace('#', '');
  const normalized =
    value.length === 3
      ? value
          .split('')
          .map((c) => c + c)
          .join('')
      : value;
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  if ([r, g, b].some(Number.isNaN)) {
    return '#ffffff';
  }
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? '#16202c' : '#ffffff';
};

/** Short date for the release line, e.g. "Jan 5, 2026"; null when absent. */
const formatReleaseDate = (iso: string | null): string | null => {
  if (!iso) {
    return null;
  }
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

interface ReleaseHeadline {
  /** The version tag (e.g. "v1.2.0"); null when the repo has no release. */
  version: string | null;
  /** Short publish date, or null. */
  date: string | null;
}

/**
 * Split the release headline into its version tag and date so the card can
 * render the version as a mono tag and the date as muted secondary text.
 */
export const releaseHeadline = (repo: Repo): ReleaseHeadline => ({
  version: repo.latestReleaseVersion,
  date: formatReleaseDate(repo.latestReleasePublishedAt),
});

/** Relative "synced 2h ago"-style label from an ISO timestamp. */
export const formatRelativeTime = (iso: string | null): string => {
  if (!iso) {
    return 'never synced';
  }
  const then = new Date(iso).getTime();
  const diffMs = Date.now() - then;
  const minutes = Math.round(diffMs / 60000);
  if (minutes < 1) {
    return 'just now';
  }
  if (minutes < 60) {
    return `${minutes}m ago`;
  }
  const hours = Math.round(minutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }
  const days = Math.round(hours / 24);
  return `${days}d ago`;
};

/** Sync-freshness bucket keyed off `lastSyncedAt` age. */
export type SyncFreshness = 'fresh' | 'stale' | 'old';

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const MONTH_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Bucket a repo by how long ago it last synced:
 *   - `fresh`: synced < 1 week ago
 *   - `stale`: synced >= 1 week and <= 1 month ago
 *   - `old`:   synced > 1 month ago, or never synced (null)
 * Maps to success/warning/error in the freshness dot.
 */
export const syncFreshness = (lastSyncedAt: string | null): SyncFreshness => {
  if (!lastSyncedAt) {
    return 'old';
  }
  const age = Date.now() - new Date(lastSyncedAt).getTime();
  if (age < WEEK_MS) {
    return 'fresh';
  }
  if (age <= MONTH_MS) {
    return 'stale';
  }
  return 'old';
};

interface SyncBadgeView {
  label: string;
  color: 'error' | 'default';
}

/**
 * Maps `lastSyncStatus` + `lastSyncedAt` to a sync-status label. A failed or
 * in-progress sync surfaces in its own state; otherwise the badge reports when
 * the repo last synced. Freshness coloring is owned by `SyncDot` next to it.
 */
export const syncBadgeView = (
  status: SyncStatus | null,
  lastSyncedAt: string | null,
): SyncBadgeView => {
  if (status === 'ERROR') {
    return { label: 'sync failed', color: 'error' };
  }
  if (status === 'PENDING') {
    return { label: 'syncing…', color: 'default' };
  }
  if (!lastSyncedAt) {
    return { label: 'never synced', color: 'default' };
  }
  return { label: `synced ${formatRelativeTime(lastSyncedAt)}`, color: 'default' };
};
