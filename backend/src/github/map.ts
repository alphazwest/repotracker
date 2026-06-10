import type { LanguageDto } from '../dto/index.js';
import type {
  GitHubRepoDto,
  RawLanguagesResponse,
  RawRepoResponse,
  RawReleaseResponse,
} from './types.js';

/**
 * Linguist colors for common languages. GitHub's languages endpoint returns
 * bytes only, not colors; this covers the popular set and falls back to null
 * for the long tail (the UI then renders a neutral chip).
 */
const LANGUAGE_COLORS: Record<string, string> = {
  JavaScript: '#f1e05a',
  TypeScript: '#3178c6',
  Python: '#3572A5',
  Java: '#b07219',
  Go: '#00ADD8',
  Rust: '#dea584',
  C: '#555555',
  'C++': '#f34b7d',
  'C#': '#178600',
  Ruby: '#701516',
  PHP: '#4F5D95',
  Swift: '#F05138',
  Kotlin: '#A97BFF',
  Scala: '#c22d40',
  Shell: '#89e051',
  HTML: '#e34c26',
  CSS: '#563d7c',
  SCSS: '#c6538c',
  Vue: '#41b883',
  Dart: '#00B4AB',
  Elixir: '#6e4a7e',
  Haskell: '#5e5086',
  Lua: '#000080',
  'Objective-C': '#438eff',
  Perl: '#0298c3',
  R: '#198CE7',
  Clojure: '#db5855',
  Erlang: '#B83998',
  Dockerfile: '#384d54',
  Makefile: '#427819',
  PowerShell: '#012456',
  Zig: '#ec915c',
};

const colorFor = (name: string): string | null => LANGUAGE_COLORS[name] ?? null;

/** Top 3 languages by bytes, with colors where known. */
export const topLanguages = (languages: RawLanguagesResponse): LanguageDto[] =>
  Object.entries(languages)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([name]) => ({ name, color: colorFor(name) }));

/** Map raw GitHub responses to the persisted-fields DTO. */
export const mapToRepoDto = (
  repo: RawRepoResponse,
  languages: RawLanguagesResponse,
  release: RawReleaseResponse | null,
): GitHubRepoDto => ({
  githubId: repo.id,
  owner: repo.owner.login,
  name: repo.name,
  description: repo.description,
  url: repo.html_url,
  authorUrl: repo.owner.html_url,
  avatarUrl: repo.owner.avatar_url,
  stars: repo.stargazers_count,
  watchers: repo.subscribers_count,
  forks: repo.forks_count,
  languages: topLanguages(languages),
  latestReleaseVersion: release ? release.tag_name : null,
  latestReleasePublishedAt:
    release && release.published_at ? new Date(release.published_at) : null,
  latestReleaseUrl: release ? release.html_url : null,
});
