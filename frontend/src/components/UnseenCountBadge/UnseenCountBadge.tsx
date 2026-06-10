import Badge from '@mui/material/Badge';
import Box from '@mui/material/Box';
import Tooltip from '@mui/material/Tooltip';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { useUnseenCount } from '@/hooks';

/**
 * Passive header indicator: a bell with a red count badge (hidden at zero). Not
 * interactive — the only call-to-action in the header is "Add Repo"; the unseen
 * quick-filter lives in the filter drawer. The count comes from `useUnseenCount`
 * (derived from the shared tracked-repo cache).
 */
export const UnseenCountBadge = () => {
  const count = useUnseenCount();
  const label =
    count > 0
      ? `${count} unseen release${count === 1 ? '' : 's'}`
      : 'No unseen releases';

  return (
    <Tooltip title={label}>
      <Box
        component="span"
        aria-label={label}
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          px: 1,
          color: count > 0 ? 'text.primary' : 'text.secondary',
        }}
      >
        <Badge
          badgeContent={count}
          max={99}
          color="error"
          invisible={count === 0}
          data-testid="unseen-count"
          sx={{
            // ~20% smaller than MUI's default badge so it doesn't bleed into
            // the adjacent Add Repo button.
            '& .MuiBadge-badge': {
              height: 16,
              minWidth: 16,
              fontSize: '0.6rem',
              padding: '0 4px',
            },
          }}
        >
          <NotificationsIcon />
        </Badge>
      </Box>
    </Tooltip>
  );
};
