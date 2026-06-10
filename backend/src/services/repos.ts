import { parseRepoCoordinate } from '../github/parse.js';
import { fetchRepo } from '../github/client.js';
import {
  findRepoByOwnerName,
  findTrackedRepo,
  isRepoTrackedByUser,
  linkUserRepo,
  listTrackedRepos as dalListTrackedRepos,
  setWatermark,
  unlinkUserRepo,
  upsertRepo,
} from '../dal/repos.js';
import type {
  ListReposInput,
  RepoConnectionDto,
  RepoPreviewDto,
  TrackedRepoDto,
} from '../dto/index.js';
import { ghRepoToUpsertInput } from '../dto/mappers.js';
import { syncAllTrackedRepos, syncRepoById } from './sync.js';
import { ServiceError, githubErrorToServiceError } from './errors.js';

export { ServiceError } from './errors.js';
export type { ServiceErrorKind } from './errors.js';

/**
 * Track a repo for a user. Resolves the URL via GitHub, upserts the globally
 * deduped Repo, and links the user — setting the seen watermark to the repo's
 * CURRENT latest version, so a newly tracked repo starts "seen" (the user is
 * acknowledging current state, not asking to be alerted about a shipped
 * release). `unseen` flips true only when a future sync brings a newer version.
 */
export const trackRepo = async (
  userId: string,
  url: string,
): Promise<TrackedRepoDto> => {
  const parsed = parseRepoCoordinate(url);
  if (!parsed.ok) {
    throw new ServiceError('INVALID_URL', `Invalid GitHub repo URL: ${parsed.reason}`);
  }

  const existing = await findRepoByOwnerName(
    parsed.coordinate.owner,
    parsed.coordinate.name,
  );

  const result = await fetchRepo(parsed.coordinate);
  if (!result.ok) {
    if (result.error.kind === 'NOT_FOUND') {
      throw new ServiceError('NOT_FOUND', 'Repository not found on GitHub');
    }
    throw githubErrorToServiceError(result.error);
  }
  const repo = await upsertRepo(
    ghRepoToUpsertInput(result.repo, new Date(), 'SUCCESS'),
  );

  if (existing) {
    const alreadyLinked = await findTrackedRepo(userId, repo.id);
    if (alreadyLinked) {
      throw new ServiceError('ALREADY_TRACKED', 'You already track this repo');
    }
  }

  // Watermark = current latest version → newly tracked repo starts seen.
  await linkUserRepo(userId, repo.id, repo.latestReleaseVersion);

  const tracked = await findTrackedRepo(userId, repo.id);
  if (!tracked) {
    throw new ServiceError('NOT_FOUND', 'Failed to load the tracked repo');
  }
  return tracked;
};

/**
 * Validate a repo URL without tracking it. Reports a status the add modal uses
 * to gate the track action. Ordering is deliberate: parse first (no I/O), then
 * a cheap "already tracked?" DB check (avoids a GitHub call for repos the user
 * has), then GitHub existence. Never throws — failures are statuses.
 */
export const previewRepo = async (
  userId: string,
  url: string,
): Promise<RepoPreviewDto> => {
  const parsed = parseRepoCoordinate(url);
  if (!parsed.ok) {
    return { status: 'INVALID_URL', owner: null, name: null };
  }
  const { owner, name } = parsed.coordinate;

  if (await isRepoTrackedByUser(userId, owner, name)) {
    return { status: 'ALREADY_TRACKED', owner, name };
  }

  const result = await fetchRepo(parsed.coordinate);
  if (!result.ok) {
    if (result.error.kind === 'NOT_FOUND') {
      return { status: 'NOT_FOUND', owner, name };
    }
    throw githubErrorToServiceError(result.error);
  }
  return { status: 'VALID', owner, name };
};

/** Untrack a repo for a user. Returns true if a link was removed. */
export const untrackRepo = async (
  userId: string,
  repoId: string,
): Promise<boolean> => unlinkUserRepo(userId, repoId);

/**
 * Mark a repo seen: advance the user's watermark to the repo's current latest
 * version in a single update and return the updated TrackedRepoDto (incl.
 * `unseen`) so the client cache patches without a refetch.
 */
export const markSeen = async (
  userId: string,
  repoId: string,
): Promise<TrackedRepoDto> => {
  const tracked = await findTrackedRepo(userId, repoId);
  if (!tracked) {
    throw new ServiceError('NOT_FOUND', 'Repo is not tracked');
  }
  await setWatermark(userId, repoId, tracked.latestReleaseVersion);
  const updated = await findTrackedRepo(userId, repoId);
  if (!updated) {
    throw new ServiceError('NOT_FOUND', 'Repo is not tracked');
  }
  return updated;
};

/** List a user's tracked repos with search/filter/pagination. */
export const listTrackedRepos = (
  input: ListReposInput,
): Promise<RepoConnectionDto> => dalListTrackedRepos(input);

/**
 * Refresh a single tracked repo (one-off sync), then return the user's updated
 * TrackedRepoDto so the client cache patches.
 */
export const refreshRepo = async (
  userId: string,
  repoId: string,
): Promise<TrackedRepoDto> => {
  const result = await syncRepoById(repoId);
  if (!result.ok) {
    throw new ServiceError('GITHUB_ERROR', result.message);
  }
  const tracked = await findTrackedRepo(userId, repoId);
  if (!tracked) {
    throw new ServiceError('NOT_FOUND', 'Repo is not tracked');
  }
  return tracked;
};

/**
 * Refresh all repos and return the user's tracked set afterward. Shares the
 * sync path with the cron sweep via {@link syncAllTrackedRepos}.
 */
export const refreshAll = async (userId: string): Promise<TrackedRepoDto[]> => {
  await syncAllTrackedRepos();
  const connection = await dalListTrackedRepos({
    userId,
    page: 1,
    pageSize: Number.MAX_SAFE_INTEGER,
  });
  return connection.nodes;
};
