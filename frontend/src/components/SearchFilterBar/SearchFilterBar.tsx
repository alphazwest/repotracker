import { useEffect, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import Badge from '@mui/material/Badge';
import Tooltip from '@mui/material/Tooltip';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import { activeConditionCount } from '@/hooks/repoQuery';
import type { FilterModel, SortState, ViewMode } from '@/types';
import { useDebouncedValue } from './hooks';
import { SortControl } from './components/SortControl';
import { ViewToggle } from '../RepoList';
import { TOOLBAR_CONTROL_HEIGHT } from './types';

interface SearchFilterBarProps {
  search: string;
  onSearchChange: (next: string) => void;
  sort: SortState;
  onSortChange: (next: SortState) => void;
  /** Active filter model (for the funnel badge count). */
  filter: FilterModel;
  onOpenFilters: () => void;
  /** Current list/card view mode (owned + persisted by the parent). */
  view: ViewMode;
  onViewChange: (next: ViewMode) => void;
}

/**
 * Sub-toolbar below the app bar: a growing search field, the sort control, the
 * list/card view toggle, and a funnel button (badged with the active-condition
 * count) that opens the right-hand filter drawer. Search is debounced locally
 * and pushed up; sort, filter, and view state live in the parent.
 */
export const SearchFilterBar = ({
  search,
  onSearchChange,
  sort,
  onSortChange,
  filter,
  onOpenFilters,
  view,
  onViewChange,
}: SearchFilterBarProps) => {
  const [searchInput, setSearchInput] = useState(search);
  const debouncedSearch = useDebouncedValue(searchInput, 250);
  const onChangeRef = useRef(onSearchChange);
  onChangeRef.current = onSearchChange;

  // Keep local input in sync if the parent resets search externally.
  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  // Emit the debounced search upward only when it actually changes.
  useEffect(() => {
    if (debouncedSearch !== search) {
      onChangeRef.current(debouncedSearch);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const activeCount = activeConditionCount(filter);

  // Below `md` the strip stacks into two rows (search on top, full width; sort +
  // view/filter cluster below). At `md` and up it is a single inline row. The
  // controls wrapper uses `display: contents` on desktop so SortControl,
  // ViewToggle, and the filter button stay direct children of the row and the
  // desktop layout is identical to before.
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        alignItems: { md: 'center' },
        gap: 1.5,
      }}
    >
      <TextField
        placeholder="Search name, owner, description"
        value={searchInput}
        onChange={(event) => setSearchInput(event.target.value)}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          },
          htmlInput: { 'aria-label': 'search repositories' },
        }}
        sx={{
          flex: { md: 1 },
          width: { xs: '100%', md: 'auto' },
          '& .MuiOutlinedInput-root': {
            height: TOOLBAR_CONTROL_HEIGHT,
            borderRadius: '2px',
            backgroundColor: 'background.paper',
            '& fieldset': { borderColor: 'divider' },
            '&:hover fieldset': { borderColor: 'text.secondary' },
          },
          '& .MuiOutlinedInput-input': { py: 0 },
        }}
      />
      <Box
        sx={{
          display: { xs: 'flex', md: 'contents' },
          alignItems: 'center',
          gap: 1.5,
        }}
      >
        <Box sx={{ flex: { xs: 1, md: 'none' }, minWidth: 0 }}>
          <SortControl value={sort} onChange={onSortChange} />
        </Box>
        <Box
          sx={{
            display: { xs: 'flex', md: 'contents' },
            flex: { xs: '0 0 auto', md: 'none' },
            justifyContent: 'flex-end',
            alignItems: 'center',
            gap: 1.5,
          }}
        >
          <ViewToggle view={view} onChange={onViewChange} />
          <Tooltip title="Filters">
            <IconButton
              aria-label="open filters"
              onClick={onOpenFilters}
              sx={{
                height: TOOLBAR_CONTROL_HEIGHT,
                width: TOOLBAR_CONTROL_HEIGHT,
                border: '1px solid',
                borderColor: activeCount > 0 ? 'primary.main' : 'divider',
                borderRadius: '2px',
                backgroundColor: 'background.paper',
                color: activeCount > 0 ? 'primary.main' : 'inherit',
                '&:hover': {
                  backgroundColor: 'action.hover',
                  borderColor: activeCount > 0 ? 'primary.main' : 'text.secondary',
                },
              }}
            >
              <Badge
                badgeContent={activeCount}
                color="primary"
                data-testid="filter-badge"
              >
                <FilterListIcon fontSize="small" />
              </Badge>
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
    </Box>
  );
};
