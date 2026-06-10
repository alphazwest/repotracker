import { mapRepoRowToDto, mapUserRepoRowToTrackedDto } from './repos.js';

// A row shaped like Prisma's Repo (Json languages, Date columns).
const repoRow = {
  id: 'r1',
  githubId: 123,
  owner: 'facebook',
  name: 'react',
  description: 'A JS library',
  url: 'https://github.com/facebook/react',
  authorUrl: 'https://github.com/facebook',
  avatarUrl: 'https://avatars.githubusercontent.com/u/69631?v=4',
  stars: 200000,
  watchers: 6700,
  forks: 42000,
  languages: [
    { name: 'JavaScript', color: '#f1e05a' },
    { name: 'TypeScript', color: '#3178c6' },
  ],
  latestReleaseVersion: 'v18.2.0',
  latestReleasePublishedAt: new Date('2022-06-14T00:00:00Z'),
  latestReleaseUrl: 'https://github.com/facebook/react/releases/tag/v18.2.0',
  lastSyncedAt: new Date('2026-06-01T00:00:00Z'),
  lastSyncStatus: 'SUCCESS' as const,
  createdAt: new Date('2026-05-01T00:00:00Z'),
  updatedAt: new Date('2026-06-01T00:00:00Z'),
};

describe('mapRepoRowToDto', () => {
  it('maps every column and parses the languages JSON to a typed array', () => {
    const dto = mapRepoRowToDto(repoRow);
    expect(dto.id).toBe('r1');
    expect(dto.githubId).toBe(123);
    expect(dto.languages).toEqual([
      { name: 'JavaScript', color: '#f1e05a' },
      { name: 'TypeScript', color: '#3178c6' },
    ]);
    expect(dto.latestReleaseVersion).toBe('v18.2.0');
    expect(dto.lastSyncStatus).toBe('SUCCESS');
  });

  it('tolerates a null/empty languages column', () => {
    const dto = mapRepoRowToDto({ ...repoRow, languages: null });
    expect(dto.languages).toEqual([]);
  });

  it('returns a plain object, not the Prisma row (no leak)', () => {
    const dto = mapRepoRowToDto(repoRow);
    expect(dto).not.toBe(repoRow);
    expect(Object.getPrototypeOf(dto)).toBe(Object.prototype);
  });
});

describe('mapUserRepoRowToTrackedDto', () => {
  it('computes unseen=false when the watermark matches the latest version', () => {
    const dto = mapUserRepoRowToTrackedDto({
      lastSeenReleaseVersion: 'v18.2.0',
      repo: repoRow,
    });
    expect(dto.unseen).toBe(false);
    expect(dto.lastSeenReleaseVersion).toBe('v18.2.0');
  });

  it('computes unseen=true when the latest version is ahead of the watermark', () => {
    const dto = mapUserRepoRowToTrackedDto({
      lastSeenReleaseVersion: 'v17.0.0',
      repo: repoRow,
    });
    expect(dto.unseen).toBe(true);
  });

  it('computes unseen=false when the repo has no release', () => {
    const dto = mapUserRepoRowToTrackedDto({
      lastSeenReleaseVersion: null,
      repo: { ...repoRow, latestReleaseVersion: null },
    });
    expect(dto.unseen).toBe(false);
  });
});
