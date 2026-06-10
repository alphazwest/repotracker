import type { GitHubRepoDto } from '../github/types.js';
import type { RepoUpsertInput, SyncStatus } from './index.js';

/**
 * Build a RepoUpsertInput from a fresh GitHub fetch plus the sync metadata.
 * Shared by track and sync so the ~13 metadata + latest-release columns are
 * copied in exactly one place.
 */
export const ghRepoToUpsertInput = (
  gh: GitHubRepoDto,
  lastSyncedAt: Date,
  lastSyncStatus: SyncStatus,
): RepoUpsertInput => ({
  githubId: gh.githubId,
  owner: gh.owner,
  name: gh.name,
  description: gh.description,
  url: gh.url,
  authorUrl: gh.authorUrl,
  avatarUrl: gh.avatarUrl,
  stars: gh.stars,
  watchers: gh.watchers,
  forks: gh.forks,
  languages: gh.languages,
  latestReleaseVersion: gh.latestReleaseVersion,
  latestReleasePublishedAt: gh.latestReleasePublishedAt,
  latestReleaseUrl: gh.latestReleaseUrl,
  lastSyncedAt,
  lastSyncStatus,
});
