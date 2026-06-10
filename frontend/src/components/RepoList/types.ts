import type { ReactNode } from 'react';
import type { Repo, ViewMode } from '@/types';

/**
 * Render-prop for the per-repo action slot — lets a parent inject the actions
 * (mark-seen, per-repo refresh) without RepoCard/RepoRow knowing about them.
 */
export type RepoActionsSlot = (repo: Repo) => ReactNode;

export interface RepoListProps {
  repos: Repo[];
  view: ViewMode;
  loading?: boolean;
  error?: boolean;
  /** Per-repo action slot (mark-seen, refresh) supplied by the parent. */
  renderActions?: RepoActionsSlot;
  /** Action surfaced from the empty state ("add your first repo"). */
  onAddFirst?: () => void;
}

export interface RepoItemProps {
  repo: Repo;
  renderActions?: RepoActionsSlot | undefined;
}
