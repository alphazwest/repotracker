import type { Repo } from '../types';

let seq = 0;

/**
 * Build a `Repo` fixture with sensible defaults; override any field per test.
 * Includes `__typename`s so the data matches MockedProvider's auto-added
 * typenames and normalizes/merges correctly in the Apollo cache.
 */
export const makeRepo = (overrides: Partial<Repo> = {}): Repo => {
  seq += 1;
  const repo: Repo = {
    __typename: 'Repo',
    id: `repo-${seq}`,
    owner: 'octocat',
    name: `repo-${seq}`,
    description: 'A sample repository',
    url: 'https://github.com/octocat/repo',
    authorUrl: 'https://github.com/octocat',
    avatarUrl: 'https://avatars.githubusercontent.com/u/1?v=4',
    stars: 100,
    watchers: 10,
    forks: 5,
    languages: [
      { __typename: 'Language', name: 'TypeScript', color: '#3178c6' },
      { __typename: 'Language', name: 'CSS', color: '#563d7c' },
    ],
    latestReleaseVersion: 'v1.0.0',
    latestReleasePublishedAt: '2026-01-05T00:00:00.000Z',
    latestReleaseUrl: 'https://github.com/octocat/repo/releases/v1.0.0',
    unseen: false,
    lastSyncedAt: new Date().toISOString(),
    lastSyncStatus: 'SUCCESS',
    ...overrides,
  };
  return repo;
};
