import { describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithApollo, type RepoMock } from '@/test/renderWithApollo';
import { makeRepo } from '@/test/fixtures';
import { TRACKED_REPOS } from '@/lib/apollo/operations/repos';
import { FETCH_PAGE_SIZE } from '@/hooks/repoQuery';
import { REFRESH_ALL } from './hooks';
import { GlobalRefreshButton } from './RefreshControls';

const refetchMocks = (): RepoMock[] => [
  {
    request: {
      query: TRACKED_REPOS,
      variables: { pageSize: FETCH_PAGE_SIZE },
    },
    result: {
      data: {
        trackedRepos: {
          nodes: [],
          totalCount: 0,
          pageInfo: { page: 1, pageSize: FETCH_PAGE_SIZE, hasNextPage: false },
        },
      },
    },
  },
];

describe('GlobalRefreshButton', () => {
  it('global refresh triggers refreshAll', async () => {
    const user = userEvent.setup();
    let called = false;
    const mocks: RepoMock[] = [
      {
        request: { query: REFRESH_ALL },
        result: () => {
          called = true;
          return { data: { refreshAll: [makeRepo({ id: 'r1' })] } };
        },
      },
      ...refetchMocks(),
    ];

    renderWithApollo(<GlobalRefreshButton />, { mocks });
    await user.click(screen.getByRole('button', { name: /refresh all/i }));
    await waitFor(() => expect(called).toBe(true));
  });
});
