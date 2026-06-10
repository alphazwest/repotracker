import { useCallback, useEffect, useState } from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import MenuIcon from '@mui/icons-material/Menu';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';

import { useThemeMode, fontFamilyMono } from '../theme';
import { useLocalStorage, useRepoQuery, DEFAULT_SORT, STORAGE_KEYS } from '../hooks';
import { RepoList } from '../components/RepoList';
import {
  SearchFilterBar,
  FilterDrawer,
  EMPTY_FILTER_MODEL,
  useDebouncedValue,
} from '../components/SearchFilterBar';
import { Pagination } from '../components/Pagination';
import { UnseenCountBadge } from '../components/UnseenCountBadge';
import { AddRepoModal } from '../features/addRepo';
import { ConfirmRemoveDialog } from '../features/removeRepo';
import { GlobalRefreshButton } from '../features/refresh';
import { RepoActionsMenu } from '../features/repoActions';
import { MobileMenu } from './MobileMenu';
import type { FilterModel, Repo, SortState, ViewMode } from '../types';

const PAGE_SIZE = 10;

/**
 * The single application screen. The top app bar holds branding, the unseen
 * count chip, and add/refresh/theme controls; the sub-toolbar holds search,
 * sort, the list/card view toggle, and the filter funnel that opens the
 * right-hand drawer. The list/card view, pagination, and modals sit below.
 * Filtering, sorting, and pagination are
 * derived client-side from one full fetch (see `useRepoQuery`); orchestration
 * state (view, search, sort, filter, page, modal targets) lives here.
 */
export const AppShell = () => {
  const { mode, toggleMode } = useThemeMode();
  const theme = useTheme();
  // Below `md` (< 900px) the top-bar actions collapse into a hamburger menu and
  // the sub-toolbar stacks; at `md` and up the desktop layout is unchanged.
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [view, setView] = useLocalStorage<ViewMode>(STORAGE_KEYS.viewMode, 'card');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortState>(DEFAULT_SORT);
  const [filter, setFilter] = useState<FilterModel>(EMPTY_FILTER_MODEL);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [addOpen, setAddOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<Repo | null>(null);

  // Debounce the live filter so rapid edits in the drawer don't thrash the list.
  const debouncedFilter = useDebouncedValue(filter, 200);

  const { pageRepos, filteredCount, loading, error } = useRepoQuery({
    search,
    filter: debouncedFilter,
    sort,
    page,
    pageSize: PAGE_SIZE,
  });

  // Reset to page 1 whenever the result set changes shape.
  useEffect(() => {
    setPage(1);
  }, [search, debouncedFilter, sort]);

  // Render-prop for the per-repo overflow menu, threaded into each row/card.
  const renderActions = useCallback(
    (repo: Repo) => (
      <RepoActionsMenu repo={repo} onRequestRemove={setRemoveTarget} />
    ),
    [],
  );

  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <AppBar position="static" color="default">
        <Toolbar variant="dense" sx={{ gap: 1.5, flexWrap: 'wrap', py: 1 }}>
          <Typography variant="subtitle1" component="h1" sx={{ flexGrow: 1 }}>
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

          {isMobile ? (
            <Tooltip title="Menu">
              <IconButton onClick={() => setMenuOpen(true)} aria-label="open menu">
                <MenuIcon />
              </IconButton>
            </Tooltip>
          ) : (
            <>
              <UnseenCountBadge />
              <GlobalRefreshButton />
              <Tooltip title={mode === 'light' ? 'Dark Mode' : 'Light Mode'}>
                <IconButton onClick={toggleMode} aria-label="toggle color mode">
                  {mode === 'light' ? <DarkModeIcon /> : <LightModeIcon />}
                </IconButton>
              </Tooltip>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setAddOpen(true)}
                sx={{ height: 32 }}
              >
                Add Repo
              </Button>
            </>
          )}
        </Toolbar>
      </AppBar>

      <Container
        maxWidth="lg"
        sx={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          pt: 3,
        }}
      >
        <Box sx={{ flexShrink: 0, mb: 2.5 }}>
          <SearchFilterBar
            search={search}
            onSearchChange={setSearch}
            sort={sort}
            onSortChange={setSort}
            filter={filter}
            onOpenFilters={() => setFiltersOpen(true)}
            view={view}
            onViewChange={setView}
          />
        </Box>

        <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto', pb: 2 }}>
          <RepoList
            repos={pageRepos}
            view={view}
            loading={loading}
            error={error}
            renderActions={renderActions}
            onAddFirst={() => setAddOpen(true)}
          />
        </Box>

        <Box sx={{ flexShrink: 0, py: 2 }}>
          <Pagination
            page={page}
            pageSize={PAGE_SIZE}
            totalCount={filteredCount}
            onChange={setPage}
          />
        </Box>
      </Container>

      <FilterDrawer
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        value={filter}
        onChange={setFilter}
        resultCount={filteredCount}
      />

      <MobileMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        onAddRepo={() => setAddOpen(true)}
      />

      <AddRepoModal open={addOpen} onClose={() => setAddOpen(false)} />
      <ConfirmRemoveDialog
        open={removeTarget !== null}
        repoId={removeTarget?.id ?? null}
        repoLabel={
          removeTarget ? `${removeTarget.owner}/${removeTarget.name}` : undefined
        }
        onClose={() => setRemoveTarget(null)}
      />
    </Box>
  );
};
