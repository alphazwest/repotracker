import { useState } from 'react';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import CircularProgress from '@mui/material/CircularProgress';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import CheckIcon from '@mui/icons-material/Check';
import RefreshIcon from '@mui/icons-material/Refresh';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import type { Repo } from '@/types';
import { useMarkSeen } from './hooks';
import { useRefreshRepo } from '../refresh';

interface RepoActionsMenuProps {
  repo: Repo;
  /** Opens the shared ConfirmRemoveDialog for this repo. */
  onRequestRemove: (repo: Repo) => void;
}

/**
 * The per-repo overflow menu. A single vertical 3-dot button opens a Menu with
 * Mark seen (disabled once seen), Resync, and Delete. Replaces the inline icon
 * row in both the list row and the card, reclaiming horizontal space while
 * keeping every action reachable and labelled for tests/screen readers.
 */
export const RepoActionsMenu = ({ repo, onRequestRemove }: RepoActionsMenuProps) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const open = Boolean(anchorEl);

  const { markSeen, loading: marking } = useMarkSeen();
  const { refreshRepo, loading: refreshing } = useRefreshRepo();

  const close = () => setAnchorEl(null);

  const handleMarkSeen = async () => {
    close();
    await markSeen(repo.id);
  };

  const handleResync = async () => {
    close();
    await refreshRepo(repo.id);
  };

  const handleDelete = () => {
    close();
    onRequestRemove(repo);
  };

  const busy = marking || refreshing;

  return (
    <>
      <Tooltip title="Actions">
        <IconButton
          size="small"
          aria-label={`actions for ${repo.owner}/${repo.name}`}
          aria-haspopup="menu"
          onClick={(event) => setAnchorEl(event.currentTarget)}
          disabled={busy}
        >
          {busy ? <CircularProgress size={16} /> : <MoreVertIcon fontSize="small" />}
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={close}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuItem onClick={handleMarkSeen} disabled={!repo.unseen} aria-label="mark seen">
          <ListItemIcon>
            <CheckIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Mark Seen</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleResync} aria-label="resync repository">
          <ListItemIcon>
            <RefreshIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Resync</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleDelete} aria-label="delete repository">
          <ListItemIcon>
            <DeleteOutlineIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText sx={{ color: 'error.main' }}>Delete</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
};
