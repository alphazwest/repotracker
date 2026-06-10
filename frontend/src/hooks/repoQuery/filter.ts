import type {
  FilterCondition,
  FilterField,
  FilterModel,
  Repo,
} from '@/types';
import { fieldKind } from './fields';

/** Lowercased space-joined haystack a free-text search matches against. */
const searchHaystack = (repo: Repo): string =>
  [
    repo.owner,
    repo.name,
    `${repo.owner}/${repo.name}`,
    repo.description ?? '',
    repo.latestReleaseVersion ?? '',
    repo.languages.map((l) => l.name).join(' '),
  ]
    .join(' ')
    .toLowerCase();

/** Quick free-text match across name / owner / description (+ version/lang). */
export const matchesSearch = (repo: Repo, search: string): boolean => {
  const term = search.trim().toLowerCase();
  if (!term) {
    return true;
  }
  return searchHaystack(repo).includes(term);
};

/** The text value(s) a text field exposes to the predicate, lowercased. */
const textValues = (repo: Repo, field: FilterField): string[] => {
  switch (field) {
    case 'name':
      return [repo.name.toLowerCase()];
    case 'owner':
      return [repo.owner.toLowerCase()];
    case 'description':
      return [(repo.description ?? '').toLowerCase()];
    case 'version':
      return [(repo.latestReleaseVersion ?? '').toLowerCase()];
    case 'language':
      return repo.languages.map((l) => l.name.toLowerCase());
    default:
      return [];
  }
};

const numberValue = (repo: Repo, field: FilterField): number | null => {
  switch (field) {
    case 'stars':
      return repo.stars;
    case 'watchers':
      return repo.watchers;
    case 'forks':
      return repo.forks;
    default:
      return null;
  }
};

const dateValue = (repo: Repo, field: FilterField): number | null => {
  const iso =
    field === 'latestRelease' ? repo.latestReleasePublishedAt : repo.lastSyncedAt;
  if (!iso) {
    return null;
  }
  const ms = new Date(iso).getTime();
  return Number.isNaN(ms) ? null : ms;
};

const evalText = (values: string[], operator: string, raw: string): boolean => {
  const target = raw.trim().toLowerCase();
  switch (operator) {
    case 'contains':
      return values.some((v) => v.includes(target));
    case 'is':
      return values.some((v) => v === target);
    case 'startsWith':
      return values.some((v) => v.startsWith(target));
    case 'isNot':
      return !values.some((v) => v === target);
    default:
      return true;
  }
};

const evalNumber = (
  value: number | null,
  operator: string,
  target: number,
): boolean => {
  if (value === null) {
    return false;
  }
  switch (operator) {
    case 'eq':
      return value === target;
    case 'neq':
      return value !== target;
    case 'gt':
      return value > target;
    case 'lt':
      return value < target;
    case 'gte':
      return value >= target;
    case 'lte':
      return value <= target;
    default:
      return true;
  }
};

const evalDate = (
  value: number | null,
  operator: string,
  target: number,
): boolean => {
  if (value === null) {
    return false;
  }
  return operator === 'before' ? value < target : value > target;
};

/**
 * Evaluate a single condition against a repo. An empty/unparseable value is
 * inert (returns true) so a half-typed row never hides everything; the caller
 * filters such rows out of the active-count separately.
 */
export const matchesCondition = (
  repo: Repo,
  condition: FilterCondition,
): boolean => {
  const { field, operator, value } = condition;
  if (value.trim() === '') {
    return true;
  }
  const kind = fieldKind(field);

  if (kind === 'text') {
    return evalText(textValues(repo, field), operator, value);
  }
  if (kind === 'number') {
    const target = Number(value);
    if (Number.isNaN(target)) {
      return true;
    }
    return evalNumber(numberValue(repo, field), operator, target);
  }
  if (kind === 'status') {
    const want = value === 'unseen';
    return repo.unseen === want;
  }
  if (kind === 'syncStatus') {
    return repo.lastSyncStatus === value;
  }
  // date
  const target = new Date(value).getTime();
  if (Number.isNaN(target)) {
    return true;
  }
  return evalDate(dateValue(repo, field), operator, target);
};

/** A condition is "active" only when its value is non-empty. */
export const isActiveCondition = (condition: FilterCondition): boolean =>
  condition.value.trim() !== '';

/** Count of active (non-empty) conditions — drives the funnel badge. */
export const activeConditionCount = (model: FilterModel): number =>
  model.conditions.filter(isActiveCondition).length;

/**
 * Apply the filter model to a repo: active conditions joined by the model's
 * combinator (AND/OR). With no active conditions the repo always passes.
 */
export const matchesFilter = (repo: Repo, model: FilterModel): boolean => {
  const active = model.conditions.filter(isActiveCondition);
  if (active.length === 0) {
    return true;
  }
  const results = active.map((c) => matchesCondition(repo, c));
  return model.combinator === 'AND'
    ? results.every(Boolean)
    : results.some(Boolean);
};
