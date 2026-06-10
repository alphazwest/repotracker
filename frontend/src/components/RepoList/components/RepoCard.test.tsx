import { describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import { renderWithTheme } from '@/test/renderWithTheme';
import { makeRepo } from '@/test/fixtures';
import { RepoCard } from './RepoCard';

describe('RepoCard', () => {
  it('renders the latest-release version + date as the headline', () => {
    const repo = makeRepo({
      latestReleaseVersion: 'v2.3.1',
      latestReleasePublishedAt: '2026-01-05T00:00:00.000Z',
    });
    renderWithTheme(<RepoCard repo={repo} />);

    const headline = screen.getByTestId('release-headline');
    expect(headline).toHaveTextContent('v2.3.1');
    expect(headline).toHaveTextContent(/2026/);
  });

  it('marks an unseen repo with the accent edge', () => {
    renderWithTheme(<RepoCard repo={makeRepo({ unseen: true })} />);
    expect(screen.getByTestId('repo-card')).toHaveAttribute('data-unseen', 'true');
  });

  it('always shows a sync-freshness dot, colored by age', () => {
    const day = 24 * 60 * 60 * 1000;

    const { unmount } = renderWithTheme(
      <RepoCard repo={makeRepo({ lastSyncedAt: new Date().toISOString() })} />,
    );
    expect(screen.getByTestId('sync-dot')).toHaveAttribute('data-freshness', 'fresh');
    expect(screen.getByRole('status', { name: /synced/i })).toBeInTheDocument();
    unmount();

    renderWithTheme(
      <RepoCard
        repo={makeRepo({ lastSyncedAt: new Date(Date.now() - 14 * day).toISOString() })}
      />,
    );
    expect(screen.getByTestId('sync-dot')).toHaveAttribute('data-freshness', 'stale');
  });

  it('shows an "old" freshness dot when never synced', () => {
    renderWithTheme(<RepoCard repo={makeRepo({ lastSyncedAt: null })} />);
    expect(screen.getByTestId('sync-dot')).toHaveAttribute('data-freshness', 'old');
  });

  it('renders metadata (stars/watchers/forks) and top-3 languages', () => {
    const repo = makeRepo({
      stars: 42,
      watchers: 7,
      forks: 3,
      languages: [
        { name: 'Go', color: '#00ADD8' },
        { name: 'Rust', color: '#dea584' },
        { name: 'C', color: '#555555' },
        { name: 'Shell', color: '#89e051' },
      ],
    });
    renderWithTheme(<RepoCard repo={repo} />);

    expect(screen.getByLabelText('stars')).toHaveTextContent('42');
    expect(screen.getByText('Go')).toBeInTheDocument();
    expect(screen.getByText('Rust')).toBeInTheDocument();
    expect(screen.getByText('C')).toBeInTheDocument();
    // 4th language collapses into a "+1" chip rather than rendering.
    expect(screen.queryByText('Shell')).not.toBeInTheDocument();
    expect(screen.getByText('+1')).toBeInTheDocument();
  });

  it('surfaces a failed sync via the badge', () => {
    renderWithTheme(<RepoCard repo={makeRepo({ lastSyncStatus: 'ERROR' })} />);
    expect(screen.getByTestId('sync-badge')).toHaveTextContent(/failed/i);
  });

  it('renders the per-repo action slot', () => {
    renderWithTheme(
      <RepoCard
        repo={makeRepo()}
        renderActions={() => <button type="button">mark seen</button>}
      />,
    );
    const card = screen.getByTestId('repo-card');
    expect(within(card).getByRole('button', { name: /mark seen/i })).toBeInTheDocument();
  });
});
