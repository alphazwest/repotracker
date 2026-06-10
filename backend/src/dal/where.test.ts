import {
  buildUserRepoWhere,
  isUnseen,
  matchesLanguages,
  matchesUnseenOnly,
} from './where.js';

describe('buildUserRepoWhere', () => {
  it('always scopes to the userId', () => {
    const where = buildUserRepoWhere({ userId: 'u1', page: 1, pageSize: 10 });
    expect(where.userId).toBe('u1');
  });

  it('adds a case-insensitive search across owner/name/description', () => {
    const where = buildUserRepoWhere({
      userId: 'u1',
      search: 'react',
      page: 1,
      pageSize: 10,
    });
    expect(where.repo?.OR).toEqual([
      { owner: { contains: 'react', mode: 'insensitive' } },
      { name: { contains: 'react', mode: 'insensitive' } },
      { description: { contains: 'react', mode: 'insensitive' } },
    ]);
  });

  it('omits the search clause when search is blank/whitespace', () => {
    expect(
      buildUserRepoWhere({ userId: 'u1', search: '   ', page: 1, pageSize: 10 }).repo,
    ).toBeUndefined();
  });

  it('produces an identical where regardless of paging args (count reuse)', () => {
    const a = buildUserRepoWhere({ userId: 'u1', search: 'x', page: 1, pageSize: 10 });
    const b = buildUserRepoWhere({ userId: 'u1', search: 'x', page: 3, pageSize: 50 });
    expect(a).toEqual(b);
  });
});

describe('isUnseen', () => {
  it('is false when the repo has no release', () => {
    expect(isUnseen(null, null)).toBe(false);
    expect(isUnseen(null, 'v1.0.0')).toBe(false);
  });

  it('is false when the watermark equals the latest version', () => {
    expect(isUnseen('v1.0.0', 'v1.0.0')).toBe(false);
  });

  it('is true when latest exists and differs from the watermark', () => {
    expect(isUnseen('v2.0.0', 'v1.0.0')).toBe(true);
    expect(isUnseen('v1.0.0', null)).toBe(true);
  });
});

describe('matchesUnseenOnly', () => {
  it('keeps everything when unseenOnly is not set', () => {
    expect(matchesUnseenOnly(false, undefined)).toBe(true);
    expect(matchesUnseenOnly(true, undefined)).toBe(true);
    expect(matchesUnseenOnly(false, false)).toBe(true);
  });

  it('keeps only unseen rows when unseenOnly is true', () => {
    expect(matchesUnseenOnly(true, true)).toBe(true);
    expect(matchesUnseenOnly(false, true)).toBe(false);
  });
});

describe('matchesLanguages', () => {
  const langs = [
    { name: 'TypeScript', color: '#3178c6' },
    { name: 'CSS', color: '#563d7c' },
  ];

  it('keeps everything when no language filter is set', () => {
    expect(matchesLanguages(langs, undefined)).toBe(true);
    expect(matchesLanguages(langs, [])).toBe(true);
  });

  it('matches case-insensitively on any requested language', () => {
    expect(matchesLanguages(langs, ['typescript'])).toBe(true);
    expect(matchesLanguages(langs, ['Go', 'css'])).toBe(true);
  });

  it('excludes repos that have none of the requested languages', () => {
    expect(matchesLanguages(langs, ['Go', 'Rust'])).toBe(false);
  });
});
