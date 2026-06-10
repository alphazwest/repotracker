// Cross-cutting domain types mirroring the GraphQL contract. Component-scoped
// types live with their component.

/** Sync outcome values; the const is the single source the UI maps over. */
export const SYNC_STATUSES = ['SUCCESS', 'ERROR', 'PENDING'] as const;

export type SyncStatus = (typeof SYNC_STATUSES)[number];

export interface Language {
  __typename?: 'Language';
  name: string;
  color: string | null;
}

export interface Repo {
  __typename?: 'Repo';
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
  languages: Language[];
  latestReleaseVersion: string | null;
  latestReleasePublishedAt: string | null;
  latestReleaseUrl: string | null;
  unseen: boolean;
  lastSyncedAt: string | null;
  lastSyncStatus: SyncStatus | null;
}

export interface PageInfo {
  page: number;
  pageSize: number;
  hasNextPage: boolean;
}

export interface RepoConnection {
  nodes: Repo[];
  totalCount: number;
  pageInfo: PageInfo;
}

export type ViewMode = 'list' | 'card';

// --- Client-side filter / sort model -------------------------------------
// Filtering, sorting and pagination run client-side over the full tracked-repo
// set (a personal watchlist is small). These types describe the filter builder
// and sort controls; the pure predicates/comparators live in
// `src/hooks/repoQuery` and are unit-tested there.

/** Logical join applied across the active filter conditions. */
export type FilterCombinator = 'AND' | 'OR';

/** A repo field a filter condition can target, grouped by value type. */
type TextFilterField =
  | 'name'
  | 'owner'
  | 'description'
  | 'version'
  | 'language';
type NumberFilterField = 'stars' | 'watchers' | 'forks';
type StatusFilterField = 'status';
type SyncStatusFilterField = 'syncStatus';
type DateFilterField = 'latestRelease' | 'lastSynced';

export type FilterField =
  | TextFilterField
  | NumberFilterField
  | StatusFilterField
  | SyncStatusFilterField
  | DateFilterField;

type TextOperator = 'contains' | 'is' | 'startsWith' | 'isNot';
type NumberOperator = 'eq' | 'neq' | 'gt' | 'lt' | 'gte' | 'lte';
type EnumOperator = 'is';
type DateOperator = 'before' | 'after';

export type FilterOperator =
  | TextOperator
  | NumberOperator
  | EnumOperator
  | DateOperator;

/**
 * One row in the filter builder. `value` is a raw string captured from the
 * input; the predicate parses/coerces it against the field type at evaluation
 * time, so an empty/invalid value is simply inert (matches everything).
 */
export interface FilterCondition {
  id: string;
  field: FilterField;
  operator: FilterOperator;
  value: string;
}

export interface FilterModel {
  combinator: FilterCombinator;
  conditions: FilterCondition[];
}

export type SortKey =
  | 'name'
  | 'stars'
  | 'forks'
  | 'watchers'
  | 'latestRelease'
  | 'lastSynced';

export type SortDirection = 'asc' | 'desc';

export interface SortState {
  key: SortKey;
  direction: SortDirection;
}
