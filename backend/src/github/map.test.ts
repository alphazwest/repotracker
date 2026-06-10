import { mapToRepoDto, topLanguages } from './map.js';
import type {
  RawLanguagesResponse,
  RawRepoResponse,
  RawReleaseResponse,
} from './types.js';

const repo: RawRepoResponse = {
  id: 10270250,
  name: 'react',
  description: 'The library for web and native user interfaces.',
  html_url: 'https://github.com/facebook/react',
  stargazers_count: 230000,
  subscribers_count: 6600,
  forks_count: 47000,
  owner: {
    login: 'facebook',
    html_url: 'https://github.com/facebook',
    avatar_url: 'https://avatars.githubusercontent.com/u/69631?v=4',
  },
};

describe('topLanguages', () => {
  it('returns the top 3 by bytes, with linguist colors where known', () => {
    const langs: RawLanguagesResponse = {
      JavaScript: 1000,
      TypeScript: 5000,
      CSS: 200,
      HTML: 3000,
      Shell: 50,
    };
    const result = topLanguages(langs);
    expect(result.map((l) => l.name)).toEqual(['TypeScript', 'HTML', 'JavaScript']);
    expect(result[0]?.color).toBe('#3178c6');
  });

  it('returns [] for an empty languages response', () => {
    expect(topLanguages({})).toEqual([]);
  });

  it('uses null color for an unknown language', () => {
    const result = topLanguages({ Brainfuck: 10 });
    expect(result).toEqual([{ name: 'Brainfuck', color: null }]);
  });
});

describe('mapToRepoDto', () => {
  const langs: RawLanguagesResponse = { TypeScript: 5000, JavaScript: 1000 };

  it('maps metadata, using stargazers_count and subscribers_count', () => {
    const dto = mapToRepoDto(repo, langs, null);
    expect(dto.githubId).toBe(10270250);
    expect(dto.owner).toBe('facebook');
    expect(dto.name).toBe('react');
    expect(dto.url).toBe('https://github.com/facebook/react');
    expect(dto.authorUrl).toBe('https://github.com/facebook');
    expect(dto.stars).toBe(230000); // stargazers_count, not watchers_count alias
    expect(dto.watchers).toBe(6600); // subscribers_count
    expect(dto.forks).toBe(47000);
    expect(dto.languages.map((l) => l.name)).toEqual(['TypeScript', 'JavaScript']);
  });

  it('maps a latest release to version/date/url', () => {
    const release: RawReleaseResponse = {
      tag_name: 'v18.2.0',
      name: 'React 18.2',
      published_at: '2022-06-14T18:00:00Z',
      html_url: 'https://github.com/facebook/react/releases/tag/v18.2.0',
    };
    const dto = mapToRepoDto(repo, langs, release);
    expect(dto.latestReleaseVersion).toBe('v18.2.0');
    expect(dto.latestReleasePublishedAt).toEqual(new Date('2022-06-14T18:00:00Z'));
    expect(dto.latestReleaseUrl).toBe(release.html_url);
  });

  it('leaves latest-release fields null when there is no release', () => {
    const dto = mapToRepoDto(repo, langs, null);
    expect(dto.latestReleaseVersion).toBeNull();
    expect(dto.latestReleasePublishedAt).toBeNull();
    expect(dto.latestReleaseUrl).toBeNull();
  });
});
