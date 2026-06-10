/**
 * Cross-layer DTOs — plain typed shapes passed between DAL, BAL, and the API.
 *
 * These are the only repo/user shapes that cross a layer boundary. Live Prisma
 * model instances never leave the DAL; the DAL maps rows to these objects.
 */

/** Sync outcome recorded on a repo. Mirrors the Prisma `SyncStatus` enum. */
export type SyncStatus = 'SUCCESS' | 'ERROR' | 'PENDING';

/** A programming language with its display color (GitHub linguist color). */
export interface LanguageDto {
  name: string;
  color: string | null;
}

/**
 * A tracked repo as seen by the BAL/API. `unseen` is computed per user and is
 * only present on shapes produced for a specific user (e.g. the list/track
 * results); the raw DAL repo shape omits it.
 */
export interface RepoDto {
  id: string;
  githubId: number;
  owner: string;
  name: string;
  description: string | null;
  url: string;
  authorUrl: string;
  avatarUrl: string | null;
  stars: number;
  watchers: number;
  forks: number;
  languages: LanguageDto[];
  latestReleaseVersion: string | null;
  latestReleasePublishedAt: Date | null;
  latestReleaseUrl: string | null;
  lastSyncedAt: Date | null;
  lastSyncStatus: SyncStatus | null;
  createdAt: Date;
  updatedAt: Date;
}

/** A repo paired with a specific user's seen state and computed `unseen`. */
export interface TrackedRepoDto extends RepoDto {
  /** The user's watermark — the version they last acknowledged. */
  lastSeenReleaseVersion: string | null;
  /** latestReleaseVersion != null && latestReleaseVersion != watermark. */
  unseen: boolean;
}

/** Outcome of a read-only repo URL preview (validation without tracking). */
export type RepoPreviewStatus =
  | 'VALID'
  | 'INVALID_URL'
  | 'NOT_FOUND'
  | 'ALREADY_TRACKED';

/**
 * Result of `previewRepo`: a status plus the parsed owner/name when the URL
 * parses. `owner`/`name` are null only for `INVALID_URL` (nothing to report).
 */
export interface RepoPreviewDto {
  status: RepoPreviewStatus;
  owner: string | null;
  name: string | null;
}

/** A user record. */
export interface UserDto {
  id: string;
  handle: string;
  createdAt: Date;
}

/** Fields a sync/track writes onto a Repo row (metadata + latest release). */
export interface RepoUpsertInput {
  githubId: number;
  owner: string;
  name: string;
  description: string | null;
  url: string;
  authorUrl: string;
  avatarUrl: string | null;
  stars: number;
  watchers: number;
  forks: number;
  languages: LanguageDto[];
  latestReleaseVersion: string | null;
  latestReleasePublishedAt: Date | null;
  latestReleaseUrl: string | null;
  lastSyncedAt: Date;
  lastSyncStatus: SyncStatus;
}

/** Normalized inputs for the tracked-repos list query. */
export interface ListReposInput {
  userId: string;
  search?: string | undefined;
  unseenOnly?: boolean | undefined;
  languages?: string[] | undefined;
  page: number;
  pageSize: number;
}

/** Offset-pagination connection of tracked repos. */
export interface RepoConnectionDto {
  nodes: TrackedRepoDto[];
  totalCount: number;
  pageInfo: PageInfoDto;
}

/** Offset-pagination metadata. */
export interface PageInfoDto {
  page: number;
  pageSize: number;
  hasNextPage: boolean;
}
