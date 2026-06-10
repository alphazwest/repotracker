import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import ViewListIcon from '@mui/icons-material/ViewList';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import { TOOLBAR_CONTROL_HEIGHT } from '@/components/SearchFilterBar/types';
import type { ViewMode } from '@/types';

interface ViewToggleProps {
  view: ViewMode;
  onChange: (view: ViewMode) => void;
}

/** List/card view switch for the main content. */
export const ViewToggle = ({ view, onChange }: ViewToggleProps) => (
  <ToggleButtonGroup
    value={view}
    exclusive
    size="small"
    onChange={(_event, next: ViewMode | null) => {
      if (next) {
        onChange(next);
      }
    }}
    aria-label="view mode"
    sx={{
      height: TOOLBAR_CONTROL_HEIGHT,
      flexShrink: 0,
      backgroundColor: 'background.paper',
      '& .MuiToggleButton-root': {
        height: TOOLBAR_CONTROL_HEIGHT,
        borderColor: 'divider',
        borderRadius: '2px',
        color: 'text.secondary',
        '&:hover': { backgroundColor: 'action.hover' },
      },
    }}
  >
    <ToggleButton value="list" aria-label="list view">
      <ViewListIcon fontSize="small" />
    </ToggleButton>
    <ToggleButton value="card" aria-label="card view">
      <ViewModuleIcon fontSize="small" />
    </ToggleButton>
  </ToggleButtonGroup>
);
