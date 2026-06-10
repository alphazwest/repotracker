import pLimit from 'p-limit';
import { fetchRepo } from '../github/client.js';
import {
  findAllTrackedRepos,
  findRepoById,
  upsertRepo,
} from '../dal/repos.js';
import type { RepoDto } from '../dto/index.js';
import { ghRepoToUpsertInput } from '../dto/mappers.js';

/** Bound concurrency so the GitHub API is never hammered by the batch sweep. */
const SYNC_CONCURRENCY = 2;

/** Outcome of syncing a single repo. */
type SyncRepoResult =
  | { ok: true; repo: RepoDto }
  | { ok: false; repoId: string; message: string };

/**
 * Sync one repo: re-fetch metadata + latest release from GitHub and overwrite
 * the Repo row in place. Idempotent by construction — a full-column overwrite,
 * so re-running yields the same row. Shared by refreshRepo and the cron sweep.
 */
export const syncRepoByOwnerName = async (
  owner: string,
  name: string,
): Promise<SyncRepoResult> => {
  const result = await fetchRepo({ owner, name });
  if (!result.ok) {
    return {
      ok: false,
      repoId: `${owner}/${name}`,
      message: `${result.error.kind}: ${result.error.message}`,
    };
  }
  const repo = await upsertRepo(
    ghRepoToUpsertInput(result.repo, new Date(), 'SUCCESS'),
  );
  return { ok: true, repo };
};

/** Sync one tracked repo by its UUID id (used by refreshRepo). */
export const syncRepoById = async (repoId: string): Promise<SyncRepoResult> => {
  const existing = await findRepoById(repoId);
  if (!existing) {
    return { ok: false, repoId, message: 'NOT_FOUND: repo not tracked' };
  }
  return syncRepoByOwnerName(existing.owner, existing.name);
};

/**
 * Sync every tracked repo with bounded concurrency. The cron sweep and the
 * `refreshAll` mutation both call this — one shared sync path, never
 * duplicated. Returns the successfully-synced repos; failures are skipped so a
 * single bad repo doesn't abort the sweep.
 */
export const syncAllTrackedRepos = async (): Promise<RepoDto[]> => {
  const repos = await findAllTrackedRepos();
  const limit = pLimit(SYNC_CONCURRENCY);
  const results = await Promise.all(
    repos.map((repo) =>
      limit(() => syncRepoByOwnerName(repo.owner, repo.name))),
  );
  return results.filter((r): r is { ok: true; repo: RepoDto } => r.ok)
    .map((r) => r.repo);
};
