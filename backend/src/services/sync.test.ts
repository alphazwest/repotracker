import { makeGhRepo, makeRepoDto } from '../test/factories.js';
import type { GitHubResult } from '../github/types.js';
import type { RepoDto, RepoUpsertInput } from '../dto/index.js';

// Mock p-limit to a pass-through runner so the batch sweep runs serially
// under test without the real concurrency primitive.
vi.mock('p-limit', () => ({
  __esModule: true,
  default: () => (fn: () => unknown) => fn(),
}));

const fetchRepo =
  vi.fn<(coord: { owner: string; name: string }) => Promise<GitHubResult>>();
vi.mock('../github/client.js', () => ({
  fetchRepo: (...a: unknown[]) =>
    fetchRepo(...(a as [{ owner: string; name: string }])),
}));

const upsertRepo = vi.fn<(input: RepoUpsertInput) => Promise<RepoDto>>();
const findRepoById = vi.fn<(id: string) => Promise<RepoDto | null>>();
const findAllTrackedRepos = vi.fn<() => Promise<RepoDto[]>>();
vi.mock('../dal/repos.js', () => ({
  upsertRepo: (i: RepoUpsertInput) => upsertRepo(i),
  findRepoById: (id: string) => findRepoById(id),
  findAllTrackedRepos: () => findAllTrackedRepos(),
}));

// eslint-disable-next-line import/first
import {
  syncAllTrackedRepos,
  syncRepoById,
  syncRepoByOwnerName,
} from './sync.js';

const ghRepo = makeGhRepo();

const persisted = makeRepoDto;

beforeEach(() => {
  vi.clearAllMocks();
  upsertRepo.mockResolvedValue(persisted());
});

describe('syncRepoByOwnerName', () => {
  it('overwrites latestRelease* + metadata from the integration result', async () => {
    fetchRepo.mockResolvedValue({ ok: true, repo: ghRepo });
    const result = await syncRepoByOwnerName('facebook', 'react');
    expect(result.ok).toBe(true);

    const written = upsertRepo.mock.calls[0]?.[0] as RepoUpsertInput;
    expect(written.githubId).toBe(1);
    expect(written.stars).toBe(100);
    expect(written.watchers).toBe(10);
    expect(written.latestReleaseVersion).toBe('v2.0.0');
    expect(written.lastSyncStatus).toBe('SUCCESS');
    expect(written.lastSyncedAt).toBeInstanceOf(Date);
  });

  it('returns a typed failure (no throw) when GitHub fails', async () => {
    fetchRepo.mockResolvedValue({
      ok: false,
      error: { kind: 'NOT_FOUND', message: 'gone' },
    });
    const result = await syncRepoByOwnerName('x', 'y');
    expect(result.ok).toBe(false);
    expect(upsertRepo).not.toHaveBeenCalled();
  });

  it('is idempotent: re-running writes the same payload', async () => {
    fetchRepo.mockResolvedValue({ ok: true, repo: ghRepo });
    await syncRepoByOwnerName('facebook', 'react');
    await syncRepoByOwnerName('facebook', 'react');
    const first = { ...upsertRepo.mock.calls[0]?.[0], lastSyncedAt: 0 };
    const second = { ...upsertRepo.mock.calls[1]?.[0], lastSyncedAt: 0 };
    expect(first).toEqual(second);
  });
});

describe('syncRepoById', () => {
  it('resolves owner/name from the stored repo, then syncs', async () => {
    findRepoById.mockResolvedValue(persisted());
    fetchRepo.mockResolvedValue({ ok: true, repo: ghRepo });
    const result = await syncRepoById('r1');
    expect(result.ok).toBe(true);
    expect(fetchRepo).toHaveBeenCalledWith({ owner: 'facebook', name: 'react' });
  });

  it('fails typed when the repo id is unknown', async () => {
    findRepoById.mockResolvedValue(null);
    const result = await syncRepoById('missing');
    expect(result.ok).toBe(false);
  });
});

describe('syncAllTrackedRepos', () => {
  it('syncs every tracked repo and returns the successes', async () => {
    findAllTrackedRepos.mockResolvedValue([
      persisted({ id: 'r1', owner: 'a', name: 'one' }),
      persisted({ id: 'r2', owner: 'b', name: 'two' }),
    ]);
    fetchRepo.mockResolvedValue({ ok: true, repo: ghRepo });
    const synced = await syncAllTrackedRepos();
    expect(fetchRepo).toHaveBeenCalledTimes(2);
    expect(synced).toHaveLength(2);
  });

  it('skips failures so one bad repo does not abort the sweep', async () => {
    findAllTrackedRepos.mockResolvedValue([
      persisted({ id: 'r1', owner: 'a', name: 'one' }),
      persisted({ id: 'r2', owner: 'b', name: 'two' }),
    ]);
    fetchRepo
      .mockResolvedValueOnce({ ok: true, repo: ghRepo })
      .mockResolvedValueOnce({
        ok: false,
        error: { kind: 'NOT_FOUND', message: 'gone' },
      });
    const synced = await syncAllTrackedRepos();
    expect(synced).toHaveLength(1);
  });
});
