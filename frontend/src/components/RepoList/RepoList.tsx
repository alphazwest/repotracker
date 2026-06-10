import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import type { RepoListProps } from './types';
import { RepoCard } from './components/RepoCard';
import { RepoRow } from './components/RepoRow';

/**
 * Renders the tracked repos in the active view (card grid or compact list) and
 * owns the empty / loading / error presentation. The per-repo action slot is
 * threaded through to each card/row via `renderActions`.
 */
export const RepoList = ({
  repos,
  view,
  loading = false,
  error = false,
  renderActions,
  onAddFirst,
}: RepoListProps) => {
  if (loading) {
    return (
      <Box
        data-testid="repo-list-loading"
        sx={{ display: 'flex', justifyContent: 'center', py: 6 }}
      >
        <CircularProgress aria-label="loading repositories" />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" data-testid="repo-list-error">
        Could not load tracked repositories. Try refreshing.
      </Alert>
    );
  }

  if (repos.length === 0) {
    return (
      <Stack data-testid="repo-list-empty" spacing={2} alignItems="center" sx={{ py: 6 }}>
        <Typography variant="h6">No repositories tracked yet</Typography>
        <Typography variant="body2" color="text.secondary">
          Add your first repository to start watching its releases.
        </Typography>
        {onAddFirst ? (
          <Button variant="contained" onClick={onAddFirst}>
            Add a repository
          </Button>
        ) : null}
      </Stack>
    );
  }

  if (view === 'list') {
    return (
      <Stack spacing={2.5} data-testid="repo-list-view">
        {repos.map((repo) => (
          <RepoRow key={repo.id} repo={repo} renderActions={renderActions} />
        ))}
      </Stack>
    );
  }

  return (
    <Box
      data-testid="repo-card-view"
      sx={{
        display: 'grid',
        gap: 3,
        gridTemplateColumns: {
          xs: '1fr',
          sm: 'repeat(2, 1fr)',
          lg: 'repeat(3, 1fr)',
        },
      }}
    >
      {repos.map((repo) => (
        <RepoCard key={repo.id} repo={repo} renderActions={renderActions} />
      ))}
    </Box>
  );
};
