import { describe, expect, it } from 'vitest';
import { makeRepo } from '@/test/fixtures';
import { sortRepos, DEFAULT_SORT } from './sort';

describe('sortRepos', () => {
  it('keeps unseen repos ahead of seen ones regardless of key', () => {
    const seen = makeRepo({ id: 'seen', unseen: false, stars: 999 });
    const unseen = makeRepo({ id: 'unseen', unseen: true, stars: 1 });
    const out = sortRepos([seen, unseen], { key: 'stars', direction: 'desc' });
    expect(out.map((r) => r.id)).toEqual(['unseen', 'seen']);
  });

  it('sorts by stars ascending and descending within a seen group', () => {
    const a = makeRepo({ id: 'a', unseen: false, stars: 10 });
    const b = makeRepo({ id: 'b', unseen: false, stars: 30 });
    const c = makeRepo({ id: 'c', unseen: false, stars: 20 });
    expect(
      sortRepos([a, b, c], { key: 'stars', direction: 'asc' }).map((r) => r.id),
    ).toEqual(['a', 'c', 'b']);
    expect(
      sortRepos([a, b, c], { key: 'stars', direction: 'desc' }).map((r) => r.id),
    ).toEqual(['b', 'c', 'a']);
  });

  it('sorts by name case-insensitively on owner/name', () => {
    const a = makeRepo({ id: 'a', unseen: false, owner: 'zeta', name: 'x' });
    const b = makeRepo({ id: 'b', unseen: false, owner: 'Alpha', name: 'y' });
    expect(
      sortRepos([a, b], { key: 'name', direction: 'asc' }).map((r) => r.id),
    ).toEqual(['b', 'a']);
  });

  it('sorts missing dates last regardless of direction', () => {
    const dated = makeRepo({
      id: 'dated',
      unseen: false,
      latestReleasePublishedAt: '2026-01-01T00:00:00.000Z',
    });
    const undatedRepo = makeRepo({
      id: 'undated',
      unseen: false,
      latestReleasePublishedAt: null,
    });
    expect(
      sortRepos([undatedRepo, dated], { key: 'latestRelease', direction: 'asc' }).map(
        (r) => r.id,
      ),
    ).toEqual(['dated', 'undated']);
    expect(
      sortRepos([dated, undatedRepo], { key: 'latestRelease', direction: 'desc' }).map(
        (r) => r.id,
      ),
    ).toEqual(['dated', 'undated']);
  });

  it('the default sort is latest-release descending', () => {
    expect(DEFAULT_SORT).toEqual({ key: 'latestRelease', direction: 'desc' });
  });
});
