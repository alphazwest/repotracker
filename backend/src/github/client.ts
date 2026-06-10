import { mapToRepoDto } from './map.js';
import { classifyGitHubError, githubRequest, httpStatus } from './request.js';
import type {
  GitHubResult,
  RawLanguagesResponse,
  RawReleaseResponse,
  RawRepoResponse,
  RepoCoordinate,
} from './types.js';

/**
 * Fetch a repo's metadata, top languages, and latest release, mapped to a DTO.
 *
 * Pure orchestration: each call goes through the request handler
 * (`request.ts`), which owns auth, rate limits, and retry. Returns a typed
 * result; not-found / no-release / errors never throw out of here. Works
 * authenticated (GITHUB_TOKEN, 5,000 req/hr) or unauthenticated for public
 * repos (60 req/hr).
 */
export const fetchRepo = async (
  coordinate: RepoCoordinate,
): Promise<GitHubResult> => {
  const { owner, name } = coordinate;
  try {
    const repo = await githubRequest<RawRepoResponse>(
      'GET /repos/{owner}/{repo}',
      { owner, repo: name },
    );

    const languages = await githubRequest<RawLanguagesResponse>(
      'GET /repos/{owner}/{repo}/languages',
      { owner, repo: name },
    );

    let release: RawReleaseResponse | null = null;
    try {
      release = await githubRequest<RawReleaseResponse>(
        'GET /repos/{owner}/{repo}/releases/latest',
        { owner, repo: name },
      );
    } catch (error) {
      // A repo with no published release returns 404 here — a normal "no
      // release" state, not a failure. Re-throw anything else.
      if (httpStatus(error) !== 404) {
        throw error;
      }
    }

    return { ok: true, repo: mapToRepoDto(repo, languages, release) };
  } catch (error) {
    return { ok: false, error: classifyGitHubError(error) };
  }
};

export { resetGitHubClient } from './request.js';
