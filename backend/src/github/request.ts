import { Octokit } from '@octokit/core';
import { throttling } from '@octokit/plugin-throttling';
import pRetry, { AbortError } from 'p-retry';
import type { GitHubError } from './types.js';

/**
 * GitHub request handler — the single place that issues GitHub API calls.
 *
 * Owns auth resolution, the throttling plugin (primary + secondary rate-limit
 * backoff), transient-error retry, and error classification. The orchestration
 * layer (`client.ts`) composes calls through `githubRequest`; it never touches
 * Octokit or rate-limit/auth concerns directly.
 */
const ThrottledOctokit = Octokit.plugin(throttling);

/** Retries for secondary (abuse-detection) rate limits; primary limits fail fast. */
const MAX_THROTTLE_RETRIES = 2;
/** p-retry attempts for transient (network/5xx) failures. */
const MAX_TRANSIENT_RETRIES = 3;
/** Base backoff between transient retries (ms; p-retry scales it exponentially). */
const RETRY_MIN_TIMEOUT_MS = 200;

let octokit: Octokit | undefined;

/** True when a GitHub token is configured (5,000 req/hr vs 60 req/hr public). */
const isAuthenticated = (): boolean =>
  Boolean(process.env.GITHUB_TOKEN?.trim());

/**
 * Build (once) the Octokit client. Uses `GITHUB_TOKEN` when present for the
 * authenticated 5,000 req/hr limit; otherwise issues UNAUTHENTICATED requests,
 * which work for public repos at 60 req/hr per IP. The token is optional.
 */
const getOctokit = (): Octokit => {
  if (octokit) {
    return octokit;
  }
  const token = process.env.GITHUB_TOKEN?.trim() || undefined;
  octokit = new ThrottledOctokit({
    ...(token ? { auth: token } : {}),
    throttle: {
      // Primary rate limit: fail fast instead of sleeping until the reset (which
      // can be ~an hour, especially unauthenticated). Returning false makes
      // Octokit reject immediately, so the caller surfaces a clear RATE_LIMITED
      // error rather than the request hanging.
      onRateLimit: () => false,
      // Secondary (abuse-detection) limits carry a short retry-after; a couple
      // of retries is safe and usually clears.
      onSecondaryRateLimit: (_retryAfter, _options, _ok, retryCount) =>
        retryCount < MAX_THROTTLE_RETRIES,
    },
  });
  return octokit;
};

/** Octokit-style error carrying an HTTP status. */
interface HttpError {
  status?: number;
}

/** HTTP status of an Octokit error, if any. */
export const httpStatus = (error: unknown): number | undefined =>
  (error as HttpError | null)?.status;

const isTransient = (error: unknown): boolean => {
  const status = httpStatus(error);
  return status === undefined || status >= 500;
};

/** Map an unknown error to a typed `GitHubError` the caller can branch on. */
export const classifyGitHubError = (error: unknown): GitHubError => {
  const status = httpStatus(error);
  if (status === 404) {
    return { kind: 'NOT_FOUND', message: 'repository not found' };
  }
  if (status === 403 || status === 429) {
    return {
      kind: 'RATE_LIMITED',
      message: isAuthenticated()
        ? 'GitHub rate limit exceeded'
        : 'GitHub rate limit exceeded — unauthenticated requests are capped at '
          + '60 req/hr. Set GITHUB_TOKEN to a PAT for 5,000 req/hr.',
    };
  }
  return {
    kind: 'UNKNOWN',
    message: error instanceof Error ? error.message : 'unknown GitHub error',
  };
};

/** Loose view of Octokit's `request` for dynamic route strings. */
type RawRequest = (
  route: string,
  params: Record<string, unknown>,
) => Promise<{ data: unknown }>;

/**
 * Issue a single GitHub request and return its `data`, with transient
 * (network/5xx) retry. Rate limits are owned by the throttling plugin; p-retry
 * aborts immediately on non-transient errors so 404/403 surface to the caller.
 */
export const githubRequest = async <T>(
  route: string,
  params: Record<string, unknown>,
): Promise<T> =>
  pRetry(
    async () => {
      try {
        const request = getOctokit().request as unknown as RawRequest;
        const { data } = await request(route, params);
        return data as T;
      } catch (error) {
        if (!isTransient(error)) {
          throw new AbortError(error as Error);
        }
        throw error;
      }
    },
    { retries: MAX_TRANSIENT_RETRIES, minTimeout: RETRY_MIN_TIMEOUT_MS },
  );

/** Reset the cached client (test seam / token rotation). */
export const resetGitHubClient = (): void => {
  octokit = undefined;
};
