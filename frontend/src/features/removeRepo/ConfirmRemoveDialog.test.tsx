import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithApollo, type RepoMock } from '@/test/renderWithApollo';
import { TRACKED_REPOS } from '@/lib/apollo/operations/repos';
import { FETCH_PAGE_SIZE } from '@/hooks/repoQuery';
import { UNTRACK_REPO } from './operations';
import { ConfirmRemoveDialog } from './ConfirmRemoveDialog';

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
          pageInfo: { page: 1, pageSize: 10, hasNextPage: false },
        },
      },
    },
  },
];

describe('ConfirmRemoveDialog', () => {
  it('requires confirmation, then triggers the untrack mutation', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    let untrackCalled = false;
    const mocks: RepoMock[] = [
      {
        request: { query: UNTRACK_REPO, variables: { repoId: 'r1' } },
        result: () => {
          untrackCalled = true;
          return { data: { untrackRepo: true } };
        },
      },
      ...refetchMocks(),
    ];

    renderWithApollo(
      <ConfirmRemoveDialog open repoId="r1" repoLabel="octocat/repo" onClose={onClose} />,
      { mocks },
    );

    // Nothing happens without an explicit confirm.
    expect(untrackCalled).toBe(false);
    await user.click(screen.getByRole('button', { name: /^remove$/i }));

    await waitFor(() => expect(untrackCalled).toBe(true));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it('cancel closes without removing', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderWithApollo(<ConfirmRemoveDialog open repoId="r1" onClose={onClose} />, {
      mocks: [],
    });
    await user.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onClose).toHaveBeenCalled();
  });
});
