import { describe, expect, it } from 'vitest';
import { makeRepo } from '@/test/fixtures';
import type { FilterCondition, FilterModel } from '@/types';
import {
  activeConditionCount,
  matchesCondition,
  matchesFilter,
  matchesSearch,
} from './filter';

const cond = (c: Partial<FilterCondition>): FilterCondition => ({
  id: 'c1',
  field: 'name',
  operator: 'contains',
  value: '',
  ...c,
});

describe('matchesSearch', () => {
  const repo = makeRepo({
    owner: 'facebook',
    name: 'react',
    description: 'A JS library',
    latestReleaseVersion: 'v18.2.0',
    languages: [{ name: 'JavaScript', color: null }],
  });

  it('empty search matches everything', () => {
    expect(matchesSearch(repo, '   ')).toBe(true);
  });

  it('matches across name, owner, description, version and language', () => {
    expect(matchesSearch(repo, 'react')).toBe(true);
    expect(matchesSearch(repo, 'FACEBOOK')).toBe(true);
    expect(matchesSearch(repo, 'js library')).toBe(true);
    expect(matchesSearch(repo, 'v18')).toBe(true);
    expect(matchesSearch(repo, 'javascript')).toBe(true);
    expect(matchesSearch(repo, 'vue')).toBe(false);
  });
});

describe('matchesCondition — text', () => {
  const repo = makeRepo({ name: 'react', owner: 'facebook' });

  it('contains / is / startsWith / isNot', () => {
    expect(matchesCondition(repo, cond({ operator: 'contains', value: 'eac' }))).toBe(
      true,
    );
    expect(matchesCondition(repo, cond({ operator: 'is', value: 'react' }))).toBe(true);
    expect(matchesCondition(repo, cond({ operator: 'is', value: 'rea' }))).toBe(false);
    expect(matchesCondition(repo, cond({ operator: 'startsWith', value: 'rea' }))).toBe(
      true,
    );
    expect(matchesCondition(repo, cond({ operator: 'isNot', value: 'vue' }))).toBe(true);
    expect(matchesCondition(repo, cond({ operator: 'isNot', value: 'react' }))).toBe(
      false,
    );
  });

  it('language matches any of the repo languages', () => {
    const r = makeRepo({
      languages: [
        { name: 'Go', color: null },
        { name: 'Rust', color: null },
      ],
    });
    expect(matchesCondition(r, cond({ field: 'language', operator: 'is', value: 'rust' }))).toBe(
      true,
    );
    expect(matchesCondition(r, cond({ field: 'language', operator: 'is', value: 'c' }))).toBe(
      false,
    );
  });

  it('empty value is inert (matches)', () => {
    expect(matchesCondition(repo, cond({ operator: 'is', value: '' }))).toBe(true);
  });
});

describe('matchesCondition — number', () => {
  const repo = makeRepo({ stars: 100 });

  it('comparison operators', () => {
    expect(matchesCondition(repo, cond({ field: 'stars', operator: 'eq', value: '100' }))).toBe(
      true,
    );
    expect(matchesCondition(repo, cond({ field: 'stars', operator: 'neq', value: '100' }))).toBe(
      false,
    );
    expect(matchesCondition(repo, cond({ field: 'stars', operator: 'gt', value: '50' }))).toBe(
      true,
    );
    expect(matchesCondition(repo, cond({ field: 'stars', operator: 'lt', value: '50' }))).toBe(
      false,
    );
    expect(matchesCondition(repo, cond({ field: 'stars', operator: 'gte', value: '100' }))).toBe(
      true,
    );
    expect(matchesCondition(repo, cond({ field: 'stars', operator: 'lte', value: '99' }))).toBe(
      false,
    );
  });

  it('non-numeric value is inert', () => {
    expect(matchesCondition(repo, cond({ field: 'stars', operator: 'gt', value: 'abc' }))).toBe(
      true,
    );
  });
});

describe('matchesCondition — status / syncStatus', () => {
  it('status maps unseen|seen to the boolean', () => {
    const unseen = makeRepo({ unseen: true });
    const seen = makeRepo({ unseen: false });
    expect(matchesCondition(unseen, cond({ field: 'status', operator: 'is', value: 'unseen' }))).toBe(
      true,
    );
    expect(matchesCondition(seen, cond({ field: 'status', operator: 'is', value: 'unseen' }))).toBe(
      false,
    );
    expect(matchesCondition(seen, cond({ field: 'status', operator: 'is', value: 'seen' }))).toBe(
      true,
    );
  });

  it('syncStatus matches the enum', () => {
    const repo = makeRepo({ lastSyncStatus: 'ERROR' });
    expect(matchesCondition(repo, cond({ field: 'syncStatus', operator: 'is', value: 'ERROR' }))).toBe(
      true,
    );
    expect(matchesCondition(repo, cond({ field: 'syncStatus', operator: 'is', value: 'SUCCESS' }))).toBe(
      false,
    );
  });
});

describe('matchesCondition — date', () => {
  const repo = makeRepo({ latestReleasePublishedAt: '2026-01-05T00:00:00.000Z' });

  it('before / after', () => {
    expect(
      matchesCondition(repo, cond({ field: 'latestRelease', operator: 'after', value: '2026-01-01' })),
    ).toBe(true);
    expect(
      matchesCondition(repo, cond({ field: 'latestRelease', operator: 'before', value: '2026-01-01' })),
    ).toBe(false);
  });

  it('missing date never matches a real before/after bound', () => {
    const none = makeRepo({ latestReleasePublishedAt: null });
    expect(
      matchesCondition(none, cond({ field: 'latestRelease', operator: 'after', value: '2000-01-01' })),
    ).toBe(false);
  });
});

describe('matchesFilter — combinator + active count', () => {
  const repo = makeRepo({ name: 'react', stars: 100 });

  const model = (
    combinator: FilterModel['combinator'],
    conditions: FilterCondition[],
  ): FilterModel => ({ combinator, conditions });

  it('no active conditions matches everything', () => {
    expect(matchesFilter(repo, model('AND', [cond({ value: '' })]))).toBe(true);
    expect(activeConditionCount(model('AND', [cond({ value: '' })]))).toBe(0);
  });

  it('AND requires all, OR requires any', () => {
    const conds = [
      cond({ id: '1', field: 'name', operator: 'is', value: 'react' }),
      cond({ id: '2', field: 'stars', operator: 'gt', value: '500' }),
    ];
    expect(matchesFilter(repo, model('AND', conds))).toBe(false);
    expect(matchesFilter(repo, model('OR', conds))).toBe(true);
    expect(activeConditionCount(model('AND', conds))).toBe(2);
  });
});
