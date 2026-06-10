import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithApollo, type RepoMock } from '@/test/renderWithApollo';
import { makeRepo } from '@/test/fixtures';
import { useRepoQuery, FETCH_PAGE_SIZE, DEFAULT_SORT } from '@/hooks/repoQuery';
import { TRACKED_REPOS } from '@/lib/apollo/operations/repos';
import type { FilterModel, SortState, ViewMode } from '@/types';
import { RepoList } from '../RepoList';
import { SearchFilterBar } from './SearchFilterBar';
import { FilterDrawer } from './components/FilterDrawer';
import { EMPTY_FILTER_MODEL } from './types';

const repoAlpha = makeRepo({
  id: 'a',
  owner: 'octocat',
  name: 'alpha',
  stars: 10,
  unseen: false,
});
const repoReact = makeRepo({
  id: 'b',
  owner: 'octocat',
  name: 'react',
  stars: 500,
  unseen: false,
});
const repoUnseen = makeRepo({
  id: 'c',
  owner: 'octocat',
  name: 'unseen-one',
  stars: 50,
  unseen: true,
});

// One fetch returns the whole watchlist; the client filters/sorts.
const fetchMock = (nodes: ReturnType<typeof makeRepo>[]): RepoMock => ({
  request: {
    query: TRACKED_REPOS,
    variables: { pageSize: FETCH_PAGE_SIZE },
  },
  result: {
    data: {
      trackedRepos: {
        nodes,
        totalCount: nodes.length,
        pageInfo: { page: 1, pageSize: FETCH_PAGE_SIZE, hasNextPage: false },
      },
    },
  },
});

/** Wires the toolbar + drawer to the client-side repo query. */
const Harness = () => {
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortState>(DEFAULT_SORT);
  const [filter, setFilter] = useState<FilterModel>(EMPTY_FILTER_MODEL);
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<ViewMode>('list');
  const { pageRepos, filteredCount } = useRepoQuery({
    search,
    filter,
    sort,
    page: 1,
    pageSize: 10,
  });
  return (
    <>
      <SearchFilterBar
        search={search}
        onSearchChange={setSearch}
        sort={sort}
        onSortChange={setSort}
        filter={filter}
        onOpenFilters={() => setOpen(true)}
        view={view}
        onViewChange={setView}
      />
      <FilterDrawer
        open={open}
        onClose={() => setOpen(false)}
        value={filter}
        onChange={setFilter}
        resultCount={filteredCount}
      />
      <RepoList repos={pageRepos} view={view} />
    </>
  );
};

describe('SearchFilterBar + FilterDrawer (client-side)', () => {
  it('search narrows the list across name/owner/description', async () => {
    renderWithApollo(<Harness />, { mocks: [fetchMock([repoAlpha, repoReact])] });

    await screen.findByRole('link', { name: /octocat\/alpha/ });
    await screen.findByRole('link', { name: /octocat\/react/ });

    fireEvent.change(screen.getByLabelText('search repositories'), {
      target: { value: 'react' },
    });

    await waitFor(
      () =>
        expect(
          screen.queryByRole('link', { name: /octocat\/alpha/ }),
        ).not.toBeInTheDocument(),
      { timeout: 3000 },
    );
    expect(screen.getByRole('link', { name: /octocat\/react/ })).toBeInTheDocument();
  });

  it('sort by Stars ascending reorders the list', async () => {
    const user = userEvent.setup();
    renderWithApollo(<Harness />, { mocks: [fetchMock([repoReact, repoAlpha])] });

    await screen.findByRole('link', { name: /octocat\/alpha/ });

    await user.click(screen.getByRole('button', { name: /sort repositories/i }));
    await user.click(screen.getByRole('menuitem', { name: /^stars$/i }));
    await user.click(screen.getByRole('menuitem', { name: /ascending/i }));

    await waitFor(() => {
      const rows = screen.getAllByTestId('repo-row');
      // alpha (10 stars) before react (500 stars) ascending.
      expect(within(rows[0]!).getByRole('link')).toHaveTextContent('alpha');
      expect(within(rows[1]!).getByRole('link')).toHaveTextContent('react');
    });
  });

  it('hosts the list/card view toggle and switches views', async () => {
    const user = userEvent.setup();
    renderWithApollo(<Harness />, { mocks: [fetchMock([repoAlpha, repoReact])] });

    await screen.findByRole('link', { name: /octocat\/alpha/ });

    // Toggle lives in the sub-toolbar; harness starts in list view.
    expect(screen.getByTestId('repo-list-view')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /list view/i })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /card view/i }));

    expect(screen.getByTestId('repo-card-view')).toBeInTheDocument();
    expect(screen.queryByTestId('repo-list-view')).not.toBeInTheDocument();
  });

  it('a status=unseen filter condition narrows the list and badges the funnel', async () => {
    const user = userEvent.setup();
    renderWithApollo(<Harness />, { mocks: [fetchMock([repoAlpha, repoUnseen])] });

    await screen.findByRole('link', { name: /octocat\/alpha/ });

    await user.click(screen.getByRole('button', { name: /open filters/i }));
    await user.click(screen.getByRole('button', { name: /add condition/i }));

    // Switch the field to Status (value select defaults to "unseen").
    const drawer = screen.getByTestId('filter-drawer');
    await user.click(within(drawer).getByRole('combobox', { name: /field/i }));
    await user.click(screen.getByRole('option', { name: 'Status' }));

    // Filtering is deferred — nothing changes until "Apply" commits the draft.
    await user.click(within(drawer).getByTestId('apply-filters'));

    // Close the drawer (modal) so the underlying list is queryable again.
    await user.keyboard('{Escape}');
    await waitFor(() =>
      expect(screen.queryByTestId('filter-drawer')).not.toBeInTheDocument(),
    );

    await waitFor(() => {
      expect(
        screen.queryByRole('link', { name: /octocat\/alpha/ }),
      ).not.toBeInTheDocument();
    });
    expect(
      screen.getByRole('link', { name: /octocat\/unseen-one/ }),
    ).toBeInTheDocument();
    expect(screen.getByTestId('filter-badge')).toHaveTextContent('1');
  });
});
