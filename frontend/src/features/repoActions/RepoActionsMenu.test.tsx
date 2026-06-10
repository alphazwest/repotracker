import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useQuery } from '@apollo/client/react';
import { renderWithApollo, type RepoMock } from '@/test/renderWithApollo';
import { makeRepo } from '@/test/fixtures';
import { RepoCard } from '@/components/RepoList';
import { TRACKED_REPOS } from '@/lib/apollo/operations/repos';
import { FETCH_PAGE_SIZE } from '@/hooks/repoQuery';
import type { Repo } from '@/types';
import { MARK_SEEN } from './operations';
import { REFRESH_REPO } from '../refresh';
import { RepoActionsMenu } from './RepoActionsMenu';

const unseenRepo = makeRepo({ id: 'r1', unseen: true, latestReleaseVersion: 'v3.0.0' });
const seenRepo = { ...unseenRepo, unseen: false };

const listVariables = {
  pageSize: FETCH_PAGE_SIZE,
};

const listMock = (): RepoMock => ({
  request: { query: TRACKED_REPOS, variables: listVariables },
  result: {
    data: {
      trackedRepos: {
        nodes: [unseenRepo],
        totalCount: 1,
        pageInfo: { page: 1, pageSize: FETCH_PAGE_SIZE, hasNextPage: false },
      },
    },
  },
});

/** Reads the repo from the cache so a markSeen patch is observable in place. */
const Harness = () => {
  const [removed, setRemoved] = useState<Repo | null>(null);
  const { data } = useQuery(TRACKED_REPOS, {
    variables: listVariables,
  });
  const repo = data?.trackedRepos.nodes[0];
  if (!repo) {
    return <div>loading</div>;
  }
  return (
    <>
      <RepoCard
        repo={repo}
        renderActions={(r) => (
          <RepoActionsMenu repo={r} onRequestRemove={setRemoved} />
        )}
      />
      {removed ? <div data-testid="remove-target">{removed.id}</div> : null}
    </>
  );
};

const openMenu = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole('button', { name: /actions for/i }));
};

describe('RepoActionsMenu', () => {
  it('Mark seen marks the repo seen and clears the accent in place', async () => {
    const user = userEvent.setup();
    const mocks: RepoMock[] = [
      listMock(),
      {
        request: { query: MARK_SEEN, variables: { repoId: 'r1' } },
        result: { data: { markSeen: seenRepo } },
      },
    ];

    renderWithApollo(<Harness />, { mocks });

    await screen.findByTestId('sync-dot');
    expect(screen.getByTestId('repo-card')).toHaveAttribute('data-unseen', 'true');
    await openMenu(user);
    await user.click(screen.getByRole('menuitem', { name: /mark seen/i }));

    await waitFor(() => {
      expect(screen.getByTestId('repo-card')).toHaveAttribute('data-unseen', 'false');
    });

    // Once seen, the Mark seen item is present but disabled.
    await openMenu(user);
    expect(screen.getByRole('menuitem', { name: /mark seen/i })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
  });

  it('Resync triggers refreshRepo and toasts success', async () => {
    const user = userEvent.setup();
    let called = false;
    const mocks: RepoMock[] = [
      listMock(),
      {
        request: { query: REFRESH_REPO, variables: { repoId: 'r1' } },
        result: () => {
          called = true;
          return { data: { refreshRepo: makeRepo({ id: 'r1' }) } };
        },
      },
    ];

    renderWithApollo(<Harness />, { mocks });

    await screen.findByTestId('sync-dot');
    await openMenu(user);
    await user.click(screen.getByRole('menuitem', { name: /resync repository/i }));

    await waitFor(() => expect(called).toBe(true));
    expect(await screen.findByRole('alert')).toHaveTextContent(/refreshed/i);
  });

  it('Resync failure surfaces an error toast', async () => {
    const user = userEvent.setup();
    const mocks: RepoMock[] = [
      listMock(),
      {
        request: { query: REFRESH_REPO, variables: { repoId: 'r1' } },
        result: { errors: [{ message: 'GitHub rate limit exceeded.' }] },
      },
    ];

    renderWithApollo(<Harness />, { mocks });

    await screen.findByTestId('sync-dot');
    await openMenu(user);
    await user.click(screen.getByRole('menuitem', { name: /resync repository/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/failed/i);
  });

  it('Delete routes to the remove handler with the repo', async () => {
    const user = userEvent.setup();
    renderWithApollo(<Harness />, { mocks: [listMock()] });

    await screen.findByTestId('sync-dot');
    await openMenu(user);
    await user.click(screen.getByRole('menuitem', { name: /delete repository/i }));

    expect(await screen.findByTestId('remove-target')).toHaveTextContent('r1');
  });
});
