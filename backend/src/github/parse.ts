import type { RepoCoordinate } from './types.js';

/** Result of parsing a user-supplied repo reference. */
type ParseResult =
  | { ok: true; coordinate: RepoCoordinate }
  | { ok: false; reason: string };

const SEGMENT = /^[A-Za-z0-9._-]+$/;

const isValidSegment = (s: string): boolean => s.length > 0 && SEGMENT.test(s);

/**
 * Parse a GitHub repo reference into an `{ owner, name }` coordinate.
 *
 * Accepts a full URL (`https://github.com/owner/name`, with optional
 * `www.`, `.git`, trailing path/query/hash) or the bare `owner/name`
 * shorthand. Anything else — non-GitHub hosts, missing segments, junk — is a
 * typed failure, never a throw.
 */
export const parseRepoCoordinate = (input: string): ParseResult => {
  const trimmed = input.trim();
  if (!trimmed) {
    return { ok: false, reason: 'empty input' };
  }

  let ownerName = trimmed;

  if (/^https?:\/\//i.test(trimmed) || /github\.com/i.test(trimmed)) {
    let url: URL;
    try {
      url = new URL(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`);
    } catch {
      return { ok: false, reason: 'malformed URL' };
    }
    if (url.hostname.replace(/^www\./i, '').toLowerCase() !== 'github.com') {
      return { ok: false, reason: 'not a github.com URL' };
    }
    ownerName = url.pathname.replace(/^\/+/, '');
  }

  const parts = ownerName.split('/').filter((p) => p.length > 0);
  if (parts.length < 2) {
    return { ok: false, reason: 'expected owner/name' };
  }

  const owner = parts[0] as string;
  const name = (parts[1] as string).replace(/\.git$/i, '');

  if (!isValidSegment(owner) || !isValidSegment(name)) {
    return { ok: false, reason: 'invalid owner or name' };
  }

  return { ok: true, coordinate: { owner, name } };
};
