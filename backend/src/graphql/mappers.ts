import type {
  LanguageDto,
  RepoPreviewDto,
  RepoPreviewStatus,
  SyncStatus,
  TrackedRepoDto,
} from '../dto/index.js';

/** The GraphQL `Language` shape. */
interface LanguageSchema {
  name: string;
  color: string | null;
}

/** The GraphQL `Repo` shape returned by resolvers. */
export interface RepoSchema {
  id: string;
  owner: string;
  name: string;
  description: string | null;
  url: string;
  authorUrl: string;
  avatarUrl: string | null;
  stars: number;
  watchers: number;
  forks: number;
  languages: LanguageSchema[];
  latestReleaseVersion: string | null;
  latestReleasePublishedAt: Date | null;
  latestReleaseUrl: string | null;
  unseen: boolean;
  lastSyncedAt: Date | null;
  lastSyncStatus: SyncStatus | null;
}

/** The GraphQL `RepoPreview` shape returned by the previewRepo query. */
export interface RepoPreviewSchema {
  status: RepoPreviewStatus;
  owner: string | null;
  name: string | null;
}

const mapLanguage = (lang: LanguageDto): LanguageSchema => ({
  name: lang.name,
  color: lang.color,
});

/** Map a RepoPreviewDto to the GraphQL `RepoPreview` type. */
export const mapRepoPreviewToSchema = (
  dto: RepoPreviewDto,
): RepoPreviewSchema => ({
  status: dto.status,
  owner: dto.owner,
  name: dto.name,
});

/**
 * Map a TrackedRepoDto to the GraphQL `Repo` type. DateTime values stay as
 * `Date`; the custom scalar serializes them to ISO strings on the wire.
 */
export const mapTrackedRepoToSchema = (dto: TrackedRepoDto): RepoSchema => ({
  id: dto.id,
  owner: dto.owner,
  name: dto.name,
  description: dto.description,
  url: dto.url,
  authorUrl: dto.authorUrl,
  avatarUrl: dto.avatarUrl,
  stars: dto.stars,
  watchers: dto.watchers,
  forks: dto.forks,
  languages: dto.languages.map(mapLanguage),
  latestReleaseVersion: dto.latestReleaseVersion,
  latestReleasePublishedAt: dto.latestReleasePublishedAt,
  latestReleaseUrl: dto.latestReleaseUrl,
  unseen: dto.unseen,
  lastSyncedAt: dto.lastSyncedAt,
  lastSyncStatus: dto.lastSyncStatus,
});
