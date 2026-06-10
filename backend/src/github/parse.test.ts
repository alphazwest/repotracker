import { parseRepoCoordinate } from './parse.js';

describe('parseRepoCoordinate', () => {
  it('parses a full https URL', () => {
    expect(parseRepoCoordinate('https://github.com/facebook/react')).toEqual({
      ok: true,
      coordinate: { owner: 'facebook', name: 'react' },
    });
  });

  it('strips a trailing .git, slash, and extra path segments', () => {
    expect(parseRepoCoordinate('https://github.com/facebook/react.git')).toEqual({
      ok: true,
      coordinate: { owner: 'facebook', name: 'react' },
    });
    expect(
      parseRepoCoordinate('https://github.com/facebook/react/tree/main'),
    ).toEqual({ ok: true, coordinate: { owner: 'facebook', name: 'react' } });
    expect(parseRepoCoordinate('https://github.com/facebook/react/')).toEqual({
      ok: true,
      coordinate: { owner: 'facebook', name: 'react' },
    });
  });

  it('accepts http and www and a trailing query/hash', () => {
    expect(parseRepoCoordinate('http://www.github.com/a/b?tab=readme#x')).toEqual({
      ok: true,
      coordinate: { owner: 'a', name: 'b' },
    });
  });

  it('parses a bare owner/name shorthand', () => {
    expect(parseRepoCoordinate('facebook/react')).toEqual({
      ok: true,
      coordinate: { owner: 'facebook', name: 'react' },
    });
  });

  it('trims surrounding whitespace', () => {
    expect(parseRepoCoordinate('  facebook/react  ')).toEqual({
      ok: true,
      coordinate: { owner: 'facebook', name: 'react' },
    });
  });

  it('rejects empty, malformed, and non-github inputs', () => {
    const bad = [
      '',
      '   ',
      'facebook',
      'https://gitlab.com/a/b',
      'https://github.com/onlyowner',
      'not a url',
      '/',
      'a/',
      '/b',
    ];
    bad.forEach((input) => expect(parseRepoCoordinate(input).ok).toBe(false));
  });
});
