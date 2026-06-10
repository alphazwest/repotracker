import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar';
import Link from '@mui/material/Link';
import Paper from '@mui/material/Paper';
import type { RepoItemProps } from '../types';
import { SyncDot } from './SyncDot';
import { ReleaseTag } from './ReleaseTag';
import { SyncBadge } from './SyncBadge';
import { RepoMetrics, RepoLanguages } from './RepoMeta';

/**
 * Two-row list view of one repo with columns aligned across every row. A fixed
 * grid (`avatar | identity | right-cluster`) keeps avatars, names, and the
 * right-aligned clusters lined up row-to-row, removing the single-row jitter.
 *
 *   Row 1: [avatar] owner/name · version · date … sync · freshness · actions
 *   Row 2:          language chips                      … ★ 👁 ⑃ metrics
 */
export const RepoRow = ({ repo, renderActions }: RepoItemProps) => (
  <Paper
    variant="outlined"
    data-testid="repo-row"
    data-unseen={repo.unseen}
    sx={{
      px: 2,
      pt: 1.5,
      pb: 2.25,
      borderLeft: repo.unseen ? '3px solid' : '1px solid',
      borderLeftColor: repo.unseen ? 'success.main' : 'divider',
      display: 'grid',
      columnGap: 1.5,
      rowGap: 1,
      alignItems: 'center',
      gridTemplateColumns: 'auto minmax(0, 1fr) auto',
    }}
  >
    {/* Row 1 ------------------------------------------------------------- */}
    <Avatar
      src={repo.avatarUrl ?? undefined}
      alt={`${repo.owner} avatar`}
      variant="rounded"
      sx={{ width: 24, height: 24, borderRadius: '2px', gridRow: 1, gridColumn: 1 }}
    />
    <Box
      sx={{
        gridRow: 1,
        gridColumn: 2,
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        minWidth: 0,
      }}
    >
      <Link
        href={repo.url}
        target="_blank"
        rel="noreferrer"
        underline="hover"
        color="text.primary"
        noWrap
        sx={{ fontWeight: 700, fontSize: '0.9rem', minWidth: 0, flexShrink: 0 }}
      >
        {repo.owner}/{repo.name}
      </Link>
      <ReleaseTag repo={repo} />
    </Box>
    <Box
      sx={{
        gridRow: 1,
        gridColumn: 3,
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        justifyContent: 'flex-end',
      }}
    >
      <SyncBadge status={repo.lastSyncStatus} lastSyncedAt={repo.lastSyncedAt} />
      <SyncDot lastSyncedAt={repo.lastSyncedAt} />
      {renderActions ? renderActions(repo) : null}
    </Box>

    {/* Row 2 ------------------------------------------------------------- */}
    <Box sx={{ gridRow: 2, gridColumn: 2, minWidth: 0 }}>
      <RepoLanguages repo={repo} />
    </Box>
    <Box
      sx={{
        gridRow: 2,
        gridColumn: 3,
        display: 'flex',
        justifyContent: 'flex-end',
      }}
    >
      <RepoMetrics repo={repo} />
    </Box>
  </Paper>
);
