import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithTheme } from '@/test/renderWithTheme';
import { makeRepo } from '@/test/fixtures';
import type { ViewMode } from '@/types';
import { RepoList } from './RepoList';
import { ViewToggle } from './components/ViewToggle';

describe('RepoList', () => {
  it('renders the loading state', () => {
    renderWithTheme(<RepoList repos={[]} view="card" loading />);
    expect(screen.getByTestId('repo-list-loading')).toBeInTheDocument();
  });

  it('renders the error state', () => {
    renderWithTheme(<RepoList repos={[]} view="card" error />);
    expect(screen.getByTestId('repo-list-error')).toBeInTheDocument();
  });

  it('renders the empty state with an add prompt', async () => {
    const onAddFirst = vi.fn();
    renderWithTheme(<RepoList repos={[]} view="card" onAddFirst={onAddFirst} />);
    expect(screen.getByTestId('repo-list-empty')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /add a repository/i }));
    expect(onAddFirst).toHaveBeenCalledOnce();
  });

  it('renders repos with the release version headline', () => {
    const repos = [makeRepo({ latestReleaseVersion: 'v9.9.9' })];
    renderWithTheme(<RepoList repos={repos} view="card" />);
    expect(screen.getByTestId('release-headline')).toHaveTextContent('v9.9.9');
  });

  it('switches between list and card views', async () => {
    const user = userEvent.setup();
    const repos = [makeRepo(), makeRepo()];

    const Harness = () => {
      const [view, setView] = useState<ViewMode>('card');
      return (
        <>
          <ViewToggle view={view} onChange={setView} />
          <RepoList repos={repos} view={view} />
        </>
      );
    };

    renderWithTheme(<Harness />);

    expect(screen.getByTestId('repo-card-view')).toBeInTheDocument();
    expect(screen.queryByTestId('repo-list-view')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /list view/i }));

    expect(screen.getByTestId('repo-list-view')).toBeInTheDocument();
    expect(screen.queryByTestId('repo-card-view')).not.toBeInTheDocument();
  });
});
