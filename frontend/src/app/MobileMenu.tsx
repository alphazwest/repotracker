import Drawer from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import CircularProgress from '@mui/material/CircularProgress';
import AddIcon from '@mui/icons-material/Add';
import RefreshIcon from '@mui/icons-material/Refresh';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import NotificationsIcon from '@mui/icons-material/Notifications';

import { useThemeMode, fontFamilyMono } from '../theme';
import { useUnseenCount } from '../hooks';
import { useRefreshAll } from '../features/refresh';

interface MobileMenuProps {
  open: boolean;
  onClose: () => void;
  /** Open the Add-repo modal (closes the menu first). */
  onAddRepo: () => void;
}

/**
 * Right-anchored drawer that holds the top-bar actions below the `md`
 * breakpoint: the unseen count (as a header item), Add repo, global Refresh,
 * and the light/dark theme toggle. Wired to the same handlers as the desktop
 * toolbar so behaviour is identical; it just relocates the controls on phones.
 */
export const MobileMenu = ({ open, onClose, onAddRepo }: MobileMenuProps) => {
  const { mode, toggleMode } = useThemeMode();
  const unseen = useUnseenCount();
  const { refreshAll, loading: refreshing } = useRefreshAll();

  const handleAddRepo = () => {
    onClose();
    onAddRepo();
  };

  const handleRefresh = () => {
    refreshAll();
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      slotProps={{ paper: { sx: { width: 240 } } }}
    >
      <Box role="presentation" sx={{ display: 'flex', flexDirection: 'column' }}>
        <List disablePadding>
          <ListItem
            sx={{ py: 0.75, justifyContent: 'space-between', gap: 1 }}
          >
            <Typography variant="subtitle1" component="span">
              <Link
                href="/"
                underline="none"
                color="text.primary"
                aria-label="RepoTracker home"
                sx={{ fontWeight: 700, letterSpacing: '-0.01em' }}
              >
                <Box
                  component="span"
                  sx={{ color: 'primary.main', fontFamily: fontFamilyMono }}
                >
                  {'>'}
                </Box>{' '}
                RepoTracker
              </Link>
            </Typography>
            <IconButton
              onClick={onClose}
              aria-label="close menu"
              edge="end"
              size="small"
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </ListItem>
          <Divider />
          <ListItem sx={{ py: 1.25 }}>
            <ListItemIcon sx={{ minWidth: 36, color: 'text.secondary' }}>
              <NotificationsIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText
              primary={`${unseen} Unseen`}
              data-testid="unseen-count"
              slotProps={{ primary: { sx: { fontWeight: 600 } } }}
            />
          </ListItem>
          <ListItemButton onClick={handleAddRepo}>
            <ListItemIcon sx={{ minWidth: 36 }}>
              <AddIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Add Repo" />
          </ListItemButton>
          <ListItemButton
            onClick={handleRefresh}
            disabled={refreshing}
            aria-label="refresh all"
          >
            <ListItemIcon sx={{ minWidth: 36 }}>
              {refreshing ? <CircularProgress size={16} /> : <RefreshIcon fontSize="small" />}
            </ListItemIcon>
            <ListItemText primary="Refresh" />
          </ListItemButton>
          <ListItemButton onClick={toggleMode} aria-label="toggle color mode">
            <ListItemIcon sx={{ minWidth: 36 }}>
              {mode === 'light' ? (
                <DarkModeIcon fontSize="small" />
              ) : (
                <LightModeIcon fontSize="small" />
              )}
            </ListItemIcon>
            <ListItemText primary={mode === 'light' ? 'Dark Mode' : 'Light Mode'} />
          </ListItemButton>
        </List>
      </Box>
    </Drawer>
  );
};
