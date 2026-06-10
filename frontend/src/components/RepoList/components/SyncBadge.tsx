import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import type { SyncStatus } from '@/types';
import { syncBadgeView } from '../utils';

interface SyncBadgeProps {
  status: SyncStatus | null;
  lastSyncedAt: string | null;
}

const COLOR_BY_KIND = {
  error: 'error.main',
  default: 'text.secondary',
} as const;

/**
 * Quiet sync-status label. A normal sync reads as muted caption text; a failed
 * sync surfaces in its semantic color with a small dot so a broken sync stays
 * visible without shouting. Freshness coloring lives in the adjacent SyncDot.
 */
export const SyncBadge = ({ status, lastSyncedAt }: SyncBadgeProps) => {
  const { label, color } = syncBadgeView(status, lastSyncedAt);
  const textColor = COLOR_BY_KIND[color];

  return (
    <Box
      data-testid="sync-badge"
      sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}
    >
      {color === 'error' ? (
        <Box
          component="span"
          aria-hidden
          sx={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            backgroundColor: 'error.main',
          }}
        />
      ) : null}
      <Typography variant="caption" sx={{ color: textColor, fontStyle: 'italic' }}>
        {label}
      </Typography>
    </Box>
  );
};
