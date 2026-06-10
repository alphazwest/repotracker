import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithApollo, type RepoMock } from '../test/renderWithApollo';
import { makeRepo } from '../test/fixtures';
import { TRACKED_REPOS } from '../lib/apollo/operations/repos';
import { FETCH_PAGE_SIZE } from '../hooks/repoQuery';
import { MobileMenu } from './MobileMenu';

/**
 * The unseen count is derived from the tracked-repo list, so seed the list with
 * `count` repos flagged `unseen` and let `useUnseenCount` recompute it.
 */
const trackedReposMock = (count: number): RepoMock => {
  const nodes = Array.from({ length: count }, (_, i) =>
    makeRepo({ id: `unseen-${i}`, unseen: true }),
  );
  return {
    request: {
      query: TRACKED_REPOS,
      variables: { pageSize: FETCH_PAGE_SIZE },
    },
    result: {
      data: {
        trackedRepos: {
          nodes,
          totalCount: count,
          pageInfo: { page: 1, pageSize: FETCH_PAGE_SIZE, hasNextPage: false },
        },
      },
    },
  };
};

describe('MobileMenu', () => {
  it('exposes Add repo, Refresh, theme toggle, and the unseen count', async () => {
    renderWithApollo(
      <MobileMenu open onClose={() => {}} onAddRepo={() => {}} />,
      { mocks: [trackedReposMock(3)] },
    );

    // Unseen count surfaces as a header item, derived from the repo list.
    expect(await screen.findByText('3 Unseen')).toBeInTheDocument();
    // The top-bar actions are all reachable from the menu.
    expect(screen.getByRole('button', { name: /add repo/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /refresh all/i })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /toggle color mode/i }),
    ).toBeInTheDocument();
  });

  it('Add repo closes the menu and opens the modal', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onAddRepo = vi.fn();
    renderWithApollo(
      <MobileMenu open onClose={onClose} onAddRepo={onAddRepo} />,
      { mocks: [trackedReposMock(0)] },
    );

    await user.click(screen.getByRole('button', { name: /add repo/i }));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onAddRepo).toHaveBeenCalledTimes(1);
  });
});
