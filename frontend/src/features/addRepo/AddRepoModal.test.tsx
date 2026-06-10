import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithApollo, type RepoMock } from '@/test/renderWithApollo';
import { makeRepo } from '@/test/fixtures';
import { TRACKED_REPOS } from '@/lib/apollo/operations/repos';
import { FETCH_PAGE_SIZE } from '@/hooks/repoQuery';
import {
  PREVIEW_REPO,
  TRACK_REPO,
  type RepoPreviewStatus,
} from './hooks';
import { parseRepoInput } from './hooks';
import { AddRepoModal } from './AddRepoModal';

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

const previewMock = (
  url: string,
  status: RepoPreviewStatus,
  owner: string | null,
  name: string | null,
): RepoMock => ({
  request: { query: PREVIEW_REPO, variables: { url } },
  result: { data: { previewRepo: { status, owner, name } } },
});

describe('parseRepoInput', () => {
  it('parses owner/name shorthand and full URLs', () => {
    expect(parseRepoInput('octocat/Hello-World')).toMatchObject({
      owner: 'octocat',
      name: 'Hello-World',
      url: 'https://github.com/octocat/Hello-World',
    });
    expect(parseRepoInput('https://github.com/facebook/react')).toMatchObject({
      owner: 'facebook',
      name: 'react',
    });
  });

  it('rejects unparseable input', () => {
    expect(parseRepoInput('not a repo')).toBeNull();
    expect(parseRepoInput('')).toBeNull();
  });
});

describe('AddRepoModal', () => {
  it('disables the check icon until the input matches a repo pattern', async () => {
    const user = userEvent.setup();
    renderWithApollo(<AddRepoModal open onClose={vi.fn()} />, { mocks: [] });

    const check = screen.getByRole('button', { name: /check repository/i });
    expect(check).toBeDisabled();
    expect(
      screen.queryByTestId('add-repo-github-icon'),
    ).not.toBeInTheDocument();

    await user.type(
      screen.getByLabelText(/github url or owner\/name/i),
      'octocat/Hello-World',
    );

    expect(check).toBeEnabled();
    expect(screen.getByTestId('add-repo-github-icon')).toBeInTheDocument();
  });

  it('closes via the top-right X button', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderWithApollo(<AddRepoModal open onClose={onClose} />, { mocks: [] });

    await user.click(screen.getByRole('button', { name: /close/i }));
    expect(onClose).toHaveBeenCalled();
  });

  it('shows "Valid repo" after a check returns VALID', async () => {
    const user = userEvent.setup();
    const mocks: RepoMock[] = [
      previewMock(
        'https://github.com/octocat/Hello-World',
        'VALID',
        'octocat',
        'Hello-World',
      ),
    ];
    renderWithApollo(<AddRepoModal open onClose={vi.fn()} />, { mocks });

    await user.type(
      screen.getByLabelText(/github url or owner\/name/i),
      'octocat/Hello-World',
    );
    await user.click(screen.getByRole('button', { name: /check repository/i }));

    expect(await screen.findByTestId('add-repo-status')).toHaveTextContent(
      /valid repo/i,
    );
  });

  it('shows "Repo already tracked" after a check returns ALREADY_TRACKED', async () => {
    const user = userEvent.setup();
    const mocks: RepoMock[] = [
      previewMock(
        'https://github.com/octocat/Hello-World',
        'ALREADY_TRACKED',
        'octocat',
        'Hello-World',
      ),
    ];
    renderWithApollo(<AddRepoModal open onClose={vi.fn()} />, { mocks });

    await user.type(
      screen.getByLabelText(/github url or owner\/name/i),
      'octocat/Hello-World',
    );
    await user.click(screen.getByRole('button', { name: /check repository/i }));

    expect(await screen.findByTestId('add-repo-status')).toHaveTextContent(
      /already tracked/i,
    );
  });

  it('confirm triggers the track mutation and closes', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const tracked = makeRepo({ owner: 'octocat', name: 'Hello-World' });
    const mocks: RepoMock[] = [
      {
        request: {
          query: TRACK_REPO,
          variables: { url: 'https://github.com/octocat/Hello-World' },
        },
        result: { data: { trackRepo: tracked } },
      },
      ...refetchMocks(),
    ];

    renderWithApollo(<AddRepoModal open onClose={onClose} />, { mocks });

    await user.type(
      screen.getByLabelText(/github url or owner\/name/i),
      'octocat/Hello-World',
    );
    await user.click(screen.getByRole('button', { name: /add repository/i }));

    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it('surfaces a not-found/duplicate error inline', async () => {
    const user = userEvent.setup();
    const mocks: RepoMock[] = [
      {
        request: {
          query: TRACK_REPO,
          variables: { url: 'https://github.com/ghost/missing' },
        },
        result: { errors: [{ message: 'Repository not found on GitHub.' }] },
      },
    ];

    renderWithApollo(<AddRepoModal open onClose={vi.fn()} />, { mocks });

    await user.type(
      screen.getByLabelText(/github url or owner\/name/i),
      'ghost/missing',
    );
    await user.click(screen.getByRole('button', { name: /add repository/i }));

    expect(await screen.findByTestId('add-repo-error')).toHaveTextContent(
      /not found/i,
    );
  });
});
