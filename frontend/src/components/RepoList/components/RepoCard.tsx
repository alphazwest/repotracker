import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import type { RepoItemProps } from '../types';
import { SyncDot } from './SyncDot';
import { ReleaseTag } from './ReleaseTag';
import { SyncBadge } from './SyncBadge';
import { RepoMetrics, RepoLanguages } from './RepoMeta';

/**
 * Card view of one repo. Row 1 (title line) is the anchor: avatar, `owner/name`,
 * then the release version (bold mono) + date (italic muted). Row 2 carries the
 * language chips. A sync-freshness dot sits beside the sync badge at the bottom.
 * The overflow action menu sits top-right. Generous internal padding lets the
 * card breathe while staying flat and hard-edged. Unseen cards carry a green
 * accent left edge.
 */
export const RepoCard = ({ repo, renderActions }: RepoItemProps) => (
  <Card
    data-testid="repo-card"
    data-unseen={repo.unseen}
    sx={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      borderLeft: repo.unseen ? '3px solid' : '1px solid',
      borderLeftColor: repo.unseen ? 'success.main' : 'divider',
    }}
  >
    <CardContent sx={{ flexGrow: 1, p: 2, '&:last-child': { pb: 2 } }}>
      <Stack direction="row" spacing={1.25} alignItems="flex-start" sx={{ minWidth: 0 }}>
        <Avatar
          src={repo.avatarUrl ?? undefined}
          alt={`${repo.owner} avatar`}
          variant="rounded"
          sx={{ width: 26, height: 26, borderRadius: '2px', mt: 0.25 }}
        />
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            flexWrap="wrap"
            useFlexGap
            sx={{ minWidth: 0 }}
          >
            <Link
              href={repo.url}
              target="_blank"
              rel="noreferrer"
              underline="hover"
              color="text.primary"
              sx={{ fontWeight: 700, fontSize: '0.95rem', minWidth: 0 }}
              noWrap
            >
              {repo.owner}/{repo.name}
            </Link>
            <ReleaseTag repo={repo} />
          </Stack>
        </Box>
        {renderActions ? (
          <Box sx={{ mt: -0.5, mr: -0.5 }}>{renderActions(repo)}</Box>
        ) : null}
      </Stack>

      <Box sx={{ mt: 1.25 }}>
        <RepoLanguages repo={repo} />
      </Box>

      {repo.description ? (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            mt: 1.5,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {repo.description}
        </Typography>
      ) : null}

      <Box sx={{ mt: 1.75 }}>
        <RepoMetrics repo={repo} />
      </Box>

      <Box
        sx={{ mt: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}
      >
        <SyncDot lastSyncedAt={repo.lastSyncedAt} />
        <SyncBadge status={repo.lastSyncStatus} lastSyncedAt={repo.lastSyncedAt} />
      </Box>
    </CardContent>
  </Card>
);
