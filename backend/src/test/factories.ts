import type { GitHubRepoDto } from '../github/types.js';
import type { RepoDto, TrackedRepoDto } from '../dto/index.js';

/**
 * Shared test fixtures. One canonical repo shape (facebook/react) per layer DTO;
 * pass overrides for the fields a given test cares about. Keeps the ~15-field
 * literals in one place so a DTO change updates every suite at once.
 */

/** A persisted Repo DTO (post-upsert: id, sync state, timestamps). */
export const makeRepoDto = (over: Partial<RepoDto> = {}): RepoDto => ({
  id: 'r1',
  githubId: 1,
  owner: 'facebook',
  name: 'react',
  description: 'desc',
  url: 'https://github.com/facebook/react',
  authorUrl: 'https://github.com/facebook',
  avatarUrl: null,
  stars: 100,
  watchers: 10,
  forks: 20,
  languages: [{ name: 'TypeScript', color: '#3178c6' }],
  latestReleaseVersion: 'v2.0.0',
  latestReleasePublishedAt: new Date('2026-01-01T00:00:00Z'),
  latestReleaseUrl: 'https://github.com/facebook/react/releases/tag/v2.0.0',
  lastSyncedAt: new Date('2026-06-01T00:00:00Z'),
  lastSyncStatus: 'SUCCESS',
  createdAt: new Date('2026-05-01T00:00:00Z'),
  updatedAt: new Date('2026-06-01T00:00:00Z'),
  ...over,
});

/** A tracked Repo DTO = persisted Repo + the user's watermark/unseen state. */
export const makeTrackedRepoDto = (
  over: Partial<TrackedRepoDto> = {},
): TrackedRepoDto => ({
  ...makeRepoDto(),
  lastSeenReleaseVersion: 'v2.0.0',
  unseen: false,
  ...over,
});

/** A GitHub fetch DTO (pre-persist: no id, sync state, or timestamps). */
export const makeGhRepo = (
  over: Partial<GitHubRepoDto> = {},
): GitHubRepoDto => ({
  githubId: 1,
  owner: 'facebook',
  name: 'react',
  description: 'desc',
  url: 'https://github.com/facebook/react',
  authorUrl: 'https://github.com/facebook',
  avatarUrl: null,
  stars: 100,
  watchers: 10,
  forks: 20,
  languages: [{ name: 'TypeScript', color: '#3178c6' }],
  latestReleaseVersion: 'v2.0.0',
  latestReleasePublishedAt: new Date('2026-01-01T00:00:00Z'),
  latestReleaseUrl: 'https://github.com/facebook/react/releases/tag/v2.0.0',
  ...over,
});
