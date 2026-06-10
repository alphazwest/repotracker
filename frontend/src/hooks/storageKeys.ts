/**
 * localStorage keys, namespaced under `repotracker.`. Centralized so the prefix
 * stays consistent and every persisted key is discoverable in one place.
 */
export const STORAGE_KEYS = {
  themeMode: 'repotracker.theme-mode',
  viewMode: 'repotracker.view-mode',
} as const;
