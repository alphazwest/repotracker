import type { Prisma } from '@prisma/client';
import { getPrisma } from '../prisma.js';
import type {
  LanguageDto,
  ListReposInput,
  RepoConnectionDto,
  RepoDto,
  RepoUpsertInput,
  SyncStatus,
  TrackedRepoDto,
} from '../dto/index.js';
import {
  buildUserRepoWhere,
  isUnseen,
  matchesLanguages,
  matchesUnseenOnly,
} from './where.js';

/** The Repo columns the DAL reads. Loosely typed to map both Prisma rows. */
interface RepoRow {
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
  languages: unknown;
  latestReleaseVersion: string | null;
  latestReleasePublishedAt: Date | null;
  latestReleaseUrl: string | null;
  lastSyncedAt: Date | null;
  lastSyncStatus: SyncStatus | null;
  createdAt: Date;
  updatedAt: Date;
}

interface UserRepoRow {
  lastSeenReleaseVersion: string | null;
  repo: RepoRow;
}

/** Coerce the Json `languages` column into a typed LanguageDto array. */
const parseLanguages = (value: unknown): LanguageDto[] => {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .filter((v): v is { name: unknown; color?: unknown } =>
      typeof v === 'object' && v !== null && 'name' in v)
    .map((v) => ({
      name: String((v as { name: unknown }).name),
      color:
        typeof (v as { color?: unknown }).color === 'string'
          ? ((v as { color: string }).color)
          : null,
    }));
};

/** Map a Prisma Repo row to a plain RepoDto (no ORM types leak). */
export const mapRepoRowToDto = (row: RepoRow): RepoDto => ({
  id: row.id,
  githubId: row.githubId,
  owner: row.owner,
  name: row.name,
  description: row.description,
  url: row.url,
  authorUrl: row.authorUrl,
  avatarUrl: row.avatarUrl,
  stars: row.stars,
  watchers: row.watchers,
  forks: row.forks,
  languages: parseLanguages(row.languages),
  latestReleaseVersion: row.latestReleaseVersion,
  latestReleasePublishedAt: row.latestReleasePublishedAt,
  latestReleaseUrl: row.latestReleaseUrl,
  lastSyncedAt: row.lastSyncedAt,
  lastSyncStatus: row.lastSyncStatus,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

/** Map a UserRepo+repo row to a TrackedRepoDto, computing `unseen`. */
export const mapUserRepoRowToTrackedDto = (row: UserRepoRow): TrackedRepoDto => {
  const repo = mapRepoRowToDto(row.repo);
  return {
    ...repo,
    lastSeenReleaseVersion: row.lastSeenReleaseVersion,
    unseen: isUnseen(repo.latestReleaseVersion, row.lastSeenReleaseVersion),
  };
};

/** Serialize languages for a Json column write. */
const languagesForWrite = (languages: LanguageDto[]): Prisma.InputJsonValue =>
  languages as unknown as Prisma.InputJsonValue;

/**
 * Upsert a Repo by its stable githubId (rename-safe). Returns the DTO. Used by
 * track and sync — a sync is a plain full overwrite of the metadata columns.
 */
export const upsertRepo = async (input: RepoUpsertInput): Promise<RepoDto> => {
  const data = {
    githubId: input.githubId,
    owner: input.owner,
    name: input.name,
    description: input.description,
    url: input.url,
    authorUrl: input.authorUrl,
    avatarUrl: input.avatarUrl,
    stars: input.stars,
    watchers: input.watchers,
    forks: input.forks,
    languages: languagesForWrite(input.languages),
    latestReleaseVersion: input.latestReleaseVersion,
    latestReleasePublishedAt: input.latestReleasePublishedAt,
    latestReleaseUrl: input.latestReleaseUrl,
    lastSyncedAt: input.lastSyncedAt,
    lastSyncStatus: input.lastSyncStatus,
  };
  const row = await getPrisma().repo.upsert({
    where: { githubId: input.githubId },
    create: data,
    update: data,
  });
  return mapRepoRowToDto(row);
};

/** Find a repo by its UUID id. */
export const findRepoById = async (id: string): Promise<RepoDto | null> => {
  const row = await getPrisma().repo.findUnique({ where: { id } });
  return row ? mapRepoRowToDto(row) : null;
};

/** Find a repo by owner/name (the human-facing dedupe key). */
export const findRepoByOwnerName = async (
  owner: string,
  name: string,
): Promise<RepoDto | null> => {
  const row = await getPrisma().repo.findUnique({
    where: { owner_name: { owner, name } },
  });
  return row ? mapRepoRowToDto(row) : null;
};

/**
 * Whether a user already tracks the repo at owner/name. A cheap existence check
 * (no row mapping) used by the preview flow to short-circuit before a GitHub
 * call.
 */
export const isRepoTrackedByUser = async (
  userId: string,
  owner: string,
  name: string,
): Promise<boolean> => {
  const row = await getPrisma().userRepo.findFirst({
    where: { userId, repo: { owner, name } },
    select: { repoId: true },
  });
  return row !== null;
};

/** All repos tracked by any user — the sync sweep's work set. */
export const findAllTrackedRepos = async (): Promise<RepoDto[]> => {
  const rows = await getPrisma().repo.findMany({
    where: { trackedBy: { some: {} } },
  });
  return rows.map(mapRepoRowToDto);
};

/** A single user's tracked repo, with watermark + unseen, by repo id. */
export const findTrackedRepo = async (
  userId: string,
  repoId: string,
): Promise<TrackedRepoDto | null> => {
  const row = await getPrisma().userRepo.findUnique({
    where: { userId_repoId: { userId, repoId } },
    include: { repo: true },
  });
  return row ? mapUserRepoRowToTrackedDto(row) : null;
};

/** Create the user↔repo edge with the seen watermark. Idempotent per pair. */
export const linkUserRepo = async (
  userId: string,
  repoId: string,
  lastSeenReleaseVersion: string | null,
): Promise<void> => {
  await getPrisma().userRepo.upsert({
    where: { userId_repoId: { userId, repoId } },
    create: { userId, repoId, lastSeenReleaseVersion },
    update: {},
  });
};

/** Remove the user↔repo edge. Returns true if a link existed. */
export const unlinkUserRepo = async (
  userId: string,
  repoId: string,
): Promise<boolean> => {
  const result = await getPrisma().userRepo.deleteMany({
    where: { userId, repoId },
  });
  return result.count > 0;
};

/** Advance the seen watermark to a given version for one user↔repo edge. */
export const setWatermark = async (
  userId: string,
  repoId: string,
  version: string | null,
): Promise<void> => {
  await getPrisma().userRepo.updateMany({
    where: { userId, repoId },
    data: { lastSeenReleaseVersion: version },
  });
};

/**
 * List a user's tracked repos with search/filter/pagination.
 *
 * The DB-expressible `where` (userId + search) is built once and reused for the
 * fetch. The unseenOnly + languages predicates run in memory over the joined
 * result; the same filtered set yields both totalCount and the page slice, so
 * pagination totals can never drift.
 */
export const listTrackedRepos = async (
  input: ListReposInput,
): Promise<RepoConnectionDto> => {
  const where = buildUserRepoWhere(input);
  const rows = await getPrisma().userRepo.findMany({
    where,
    include: { repo: true },
    orderBy: { repo: { updatedAt: 'desc' } },
  });

  const filtered = rows
    .map(mapUserRepoRowToTrackedDto)
    .filter(
      (dto) =>
        matchesUnseenOnly(dto.unseen, input.unseenOnly)
        && matchesLanguages(dto.languages, input.languages),
    );

  const totalCount = filtered.length;
  const start = (input.page - 1) * input.pageSize;
  const nodes = filtered.slice(start, start + input.pageSize);

  return {
    nodes,
    totalCount,
    pageInfo: {
      page: input.page,
      pageSize: input.pageSize,
      hasNextPage: start + input.pageSize < totalCount,
    },
  };
};
