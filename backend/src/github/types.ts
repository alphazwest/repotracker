import type { LanguageDto } from '../dto/index.js';

/** A parsed GitHub repo coordinate. */
export interface RepoCoordinate {
  owner: string;
  name: string;
}

/**
 * The metadata + latest-release DTO produced from GitHub responses. Mirrors the
 * persisted Repo columns; the BAL feeds it into the DAL upsert. `null` latest*
 * fields mean the repo has no releases.
 */
export interface GitHubRepoDto {
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
}

/** Typed outcome of a fetch — success or a classified failure, never a throw. */
export type GitHubResult =
  | { ok: true; repo: GitHubRepoDto }
  | { ok: false; error: GitHubError };

/** Classified GitHub failure kinds the caller branches on. */
type GitHubErrorKind =
  | 'NOT_FOUND'
  | 'INVALID_URL'
  | 'RATE_LIMITED'
  | 'UNKNOWN';

export interface GitHubError {
  kind: GitHubErrorKind;
  message: string;
}

/** Raw shapes we consume from Octokit responses (subset of the API). */
export interface RawRepoResponse {
  id: number;
  name: string;
  description: string | null;
  html_url: string;
  stargazers_count: number;
  subscribers_count: number;
  forks_count: number;
  owner: {
    login: string;
    html_url: string;
    avatar_url: string | null;
  };
}

export interface RawReleaseResponse {
  tag_name: string;
  name: string | null;
  published_at: string | null;
  html_url: string;
}

/** GitHub's `GET /repos/{owner}/{repo}/languages` — bytes per language. */
export type RawLanguagesResponse = Record<string, number>;
