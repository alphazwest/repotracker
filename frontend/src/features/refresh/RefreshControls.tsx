import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import CircularProgress from '@mui/material/CircularProgress';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useRefreshAll } from './hooks';

/** Global "refresh all" control for the top toolbar (icon only). */
export const GlobalRefreshButton = () => {
  const { refreshAll, loading } = useRefreshAll();

  return (
    <Tooltip title="Refresh">
      {/* span wrapper keeps the tooltip working while the button is disabled */}
      <span>
        <IconButton
          onClick={refreshAll}
          disabled={loading}
          aria-label="refresh all"
        >
          {loading ? <CircularProgress size={18} /> : <RefreshIcon />}
        </IconButton>
      </span>
    </Tooltip>
  );
};
