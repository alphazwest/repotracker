import { describe, expect, it } from 'vitest';
import { contrastText, syncFreshness } from './utils';

const isoAgo = (ms: number): string => new Date(Date.now() - ms).toISOString();

const DAY = 24 * 60 * 60 * 1000;
const WEEK = 7 * DAY;

describe('syncFreshness', () => {
  it('is "fresh" when synced less than a week ago', () => {
    expect(syncFreshness(isoAgo(0))).toBe('fresh');
    expect(syncFreshness(isoAgo(3 * DAY))).toBe('fresh');
    expect(syncFreshness(isoAgo(WEEK - DAY))).toBe('fresh');
  });

  it('is "stale" between one week and one month ago', () => {
    expect(syncFreshness(isoAgo(WEEK + DAY))).toBe('stale');
    expect(syncFreshness(isoAgo(2 * WEEK))).toBe('stale');
    expect(syncFreshness(isoAgo(29 * DAY))).toBe('stale');
  });

  it('is "old" when synced more than a month ago', () => {
    expect(syncFreshness(isoAgo(40 * DAY))).toBe('old');
    expect(syncFreshness(isoAgo(365 * DAY))).toBe('old');
  });

  it('is "old" when never synced (null)', () => {
    expect(syncFreshness(null)).toBe('old');
  });
});

describe('contrastText', () => {
  it('returns dark text on light backgrounds', () => {
    expect(contrastText('#f1e05a')).toBe('#16202c'); // JS yellow
    expect(contrastText('#ffffff')).toBe('#16202c');
  });

  it('returns light text on dark backgrounds', () => {
    expect(contrastText('#3178c6')).toBe('#ffffff'); // TS blue
    expect(contrastText('#000000')).toBe('#ffffff');
  });

  it('expands 3-digit hex shorthand', () => {
    expect(contrastText('#fff')).toBe('#16202c');
    expect(contrastText('#000')).toBe('#ffffff');
  });

  it('falls back to white for null or unparseable input', () => {
    expect(contrastText(null)).toBe('#ffffff');
    expect(contrastText('#zzzzzz')).toBe('#ffffff');
  });
});
