import Box from '@mui/material/Box';
import Tooltip from '@mui/material/Tooltip';
import { syncFreshness, formatRelativeTime } from '../utils';
import type { SyncFreshness } from '../utils';

interface SyncDotProps {
  lastSyncedAt: string | null;
}

const COLOR_BY_FRESHNESS: Record<SyncFreshness, string> = {
  fresh: 'success.main',
  stale: 'warning.main',
  old: 'error.main',
};

/** Tooltip + aria label describing the sync freshness for a repo. */
const freshnessLabel = (
  freshness: SyncFreshness,
  lastSyncedAt: string | null,
): string => {
  if (!lastSyncedAt) {
    return 'Never synced';
  }
  const relative = formatRelativeTime(lastSyncedAt);
  if (freshness === 'fresh') {
    return `Synced ${relative}`;
  }
  if (freshness === 'stale') {
    return `Stale — synced ${relative}`;
  }
  return `Last synced over a month ago (${relative})`;
};

/**
 * Sync-freshness marker: a small solid dot colored by how long ago the repo
 * last synced — green (fresh, < 1 week), yellow (stale, <= 1 month), red (old,
 * > 1 month or never). Shown for every repo. Unseen state is carried separately
 * by the row/card's left-edge accent.
 */
export const SyncDot = ({ lastSyncedAt }: SyncDotProps) => {
  const freshness = syncFreshness(lastSyncedAt);
  const label = freshnessLabel(freshness, lastSyncedAt);

  return (
    <Tooltip title={label}>
      <Box
        component="span"
        role="status"
        aria-label={label}
        data-testid="sync-dot"
        data-freshness={freshness}
        sx={{
          flexShrink: 0,
          width: 9,
          height: 9,
          borderRadius: '50%',
          backgroundColor: COLOR_BY_FRESHNESS[freshness],
        }}
      />
    </Tooltip>
  );
};
