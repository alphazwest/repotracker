import type {
  FilterField,
  FilterOperator,
  SortKey,
} from '@/types';

/** Value type of a filter field — drives which operators/inputs apply. */
export type FieldKind = 'text' | 'number' | 'status' | 'syncStatus' | 'date';

export interface FieldMeta {
  field: FilterField;
  label: string;
  kind: FieldKind;
}

export interface OperatorMeta {
  operator: FilterOperator;
  label: string;
}

/** Selectable fields in the filter builder, in display order. */
export const FILTER_FIELDS: FieldMeta[] = [
  { field: 'name', label: 'Name', kind: 'text' },
  { field: 'owner', label: 'Owner', kind: 'text' },
  { field: 'description', label: 'Description', kind: 'text' },
  { field: 'version', label: 'Version', kind: 'text' },
  { field: 'language', label: 'Language', kind: 'text' },
  { field: 'stars', label: 'Stars', kind: 'number' },
  { field: 'watchers', label: 'Watchers', kind: 'number' },
  { field: 'forks', label: 'Forks', kind: 'number' },
  { field: 'status', label: 'Status', kind: 'status' },
  { field: 'syncStatus', label: 'Sync status', kind: 'syncStatus' },
  { field: 'latestRelease', label: 'Latest release', kind: 'date' },
  { field: 'lastSynced', label: 'Last synced', kind: 'date' },
];

/** Operators available per field kind, in display order. */
export const OPERATORS_BY_KIND: Record<FieldKind, OperatorMeta[]> = {
  text: [
    { operator: 'contains', label: 'contains' },
    { operator: 'is', label: 'is' },
    { operator: 'startsWith', label: 'starts with' },
    { operator: 'isNot', label: 'is not' },
  ],
  number: [
    { operator: 'eq', label: '=' },
    { operator: 'neq', label: '≠' },
    { operator: 'gt', label: '>' },
    { operator: 'lt', label: '<' },
    { operator: 'gte', label: '≥' },
    { operator: 'lte', label: '≤' },
  ],
  status: [{ operator: 'is', label: 'is' }],
  syncStatus: [{ operator: 'is', label: 'is' }],
  date: [
    { operator: 'before', label: 'before' },
    { operator: 'after', label: 'after' },
  ],
};

const FIELD_META_BY_FIELD = new Map<FilterField, FieldMeta>(
  FILTER_FIELDS.map((meta) => [meta.field, meta]),
);

const fieldMeta = (field: FilterField): FieldMeta => {
  const meta = FIELD_META_BY_FIELD.get(field);
  if (!meta) {
    throw new Error(`Unknown filter field: ${field}`);
  }
  return meta;
};

export const fieldKind = (field: FilterField): FieldKind =>
  fieldMeta(field).kind;

export const operatorsForField = (field: FilterField): OperatorMeta[] =>
  OPERATORS_BY_KIND[fieldKind(field)];

/** The default operator a freshly added/retyped condition adopts. */
export const defaultOperatorForField = (field: FilterField): FilterOperator => {
  const [first] = operatorsForField(field);
  if (!first) {
    throw new Error(`No operators for field: ${field}`);
  }
  return first.operator;
};

export interface SortOption {
  key: SortKey;
  label: string;
}

/** Sortable keys in display order for the sort menu. */
export const SORT_OPTIONS: SortOption[] = [
  { key: 'name', label: 'Name' },
  { key: 'stars', label: 'Stars' },
  { key: 'forks', label: 'Forks' },
  { key: 'watchers', label: 'Watchers' },
  { key: 'latestRelease', label: 'Latest release date' },
  { key: 'lastSynced', label: 'Recently synced' },
];

export const sortLabel = (key: SortKey): string =>
  SORT_OPTIONS.find((opt) => opt.key === key)?.label ?? key;
