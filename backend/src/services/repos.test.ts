import { makeGhRepo, makeRepoDto, makeTrackedRepoDto } from '../test/factories.js';
import type { GitHubResult } from '../github/types.js';
import type {
  RepoConnectionDto,
  RepoDto,
  TrackedRepoDto,
} from '../dto/index.js';

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

const findRepoByOwnerName =
  vi.fn<(owner: string, name: string) => Promise<RepoDto | null>>();
const isRepoTrackedByUser =
  vi.fn<(u: string, o: string, n: string) => Promise<boolean>>();
const findTrackedRepo =
  vi.fn<(userId: string, repoId: string) => Promise<TrackedRepoDto | null>>();
const linkUserRepo =
  vi.fn<(u: string, r: string, v: string | null) => Promise<void>>();
const unlinkUserRepo =
  vi.fn<(userId: string, repoId: string) => Promise<boolean>>();
const setWatermark =
  vi.fn<(u: string, r: string, v: string | null) => Promise<void>>();
const upsertRepo = vi.fn<(input: unknown) => Promise<RepoDto>>();
const listTrackedReposDal =
  vi.fn<(input: unknown) => Promise<RepoConnectionDto>>();
const findAllTrackedRepos = vi.fn<() => Promise<RepoDto[]>>();
const findRepoById = vi.fn<(id: string) => Promise<RepoDto | null>>();

vi.mock('../dal/repos.js', () => ({
  findRepoByOwnerName: (o: string, n: string) => findRepoByOwnerName(o, n),
  isRepoTrackedByUser: (u: string, o: string, n: string) =>
    isRepoTrackedByUser(u, o, n),
  findTrackedRepo: (u: string, r: string) => findTrackedRepo(u, r),
  linkUserRepo: (u: string, r: string, v: string | null) => linkUserRepo(u, r, v),
  unlinkUserRepo: (u: string, r: string) => unlinkUserRepo(u, r),
  setWatermark: (u: string, r: string, v: string | null) => setWatermark(u, r, v),
  upsertRepo: (i: unknown) => upsertRepo(i),
  listTrackedRepos: (i: unknown) => listTrackedReposDal(i),
  findAllTrackedRepos: () => findAllTrackedRepos(),
  findRepoById: (id: string) => findRepoById(id),
}));

// eslint-disable-next-line import/first
import {
  ServiceError,
  listTrackedRepos,
  markSeen,
  previewRepo,
  trackRepo,
} from './repos.js';

const repoDto: RepoDto = makeRepoDto();

const tracked = makeTrackedRepoDto;

const ghOk: GitHubResult = { ok: true, repo: makeGhRepo() };

beforeEach(() => {
  vi.clearAllMocks();
  upsertRepo.mockResolvedValue(repoDto);
  linkUserRepo.mockResolvedValue(undefined);
  setWatermark.mockResolvedValue(undefined);
});

describe('trackRepo', () => {
  it('upserts the repo, links the user, and sets watermark = current latest', async () => {
    findRepoByOwnerName.mockResolvedValue(null);
    fetchRepo.mockResolvedValue(ghOk);
    findTrackedRepo.mockResolvedValue(tracked());

    const result = await trackRepo('u1', 'https://github.com/facebook/react');

    expect(upsertRepo).toHaveBeenCalledTimes(1);
    expect(linkUserRepo).toHaveBeenCalledWith('u1', 'r1', 'v2.0.0');
    expect(result.unseen).toBe(false);
  });

  it('throws a typed INVALID_URL error for a malformed url', async () => {
    await expect(trackRepo('u1', 'not a url')).rejects.toMatchObject({
      kind: 'INVALID_URL',
    });
    expect(fetchRepo).not.toHaveBeenCalled();
  });

  it('throws ALREADY_TRACKED when the user already tracks the repo', async () => {
    findRepoByOwnerName.mockResolvedValue(repoDto);
    fetchRepo.mockResolvedValue(ghOk);
    findTrackedRepo.mockResolvedValue(tracked());

    await expect(
      trackRepo('u1', 'https://github.com/facebook/react'),
    ).rejects.toMatchObject({ kind: 'ALREADY_TRACKED' });
    expect(linkUserRepo).not.toHaveBeenCalled();
  });

  it('throws NOT_FOUND when GitHub cannot find the repo', async () => {
    findRepoByOwnerName.mockResolvedValue(null);
    fetchRepo.mockResolvedValue({
      ok: false,
      error: { kind: 'NOT_FOUND', message: 'gone' },
    });
    await expect(
      trackRepo('u1', 'https://github.com/x/y'),
    ).rejects.toMatchObject({ kind: 'NOT_FOUND' });
  });
});

describe('markSeen', () => {
  it('advances the watermark to the repo current latest and returns updated', async () => {
    findTrackedRepo
      .mockResolvedValueOnce(tracked({ lastSeenReleaseVersion: 'v1.0.0', unseen: true }))
      .mockResolvedValueOnce(tracked({ lastSeenReleaseVersion: 'v2.0.0', unseen: false }));

    const result = await markSeen('u1', 'r1');

    expect(setWatermark).toHaveBeenCalledWith('u1', 'r1', 'v2.0.0');
    expect(result.unseen).toBe(false);
    expect(result.lastSeenReleaseVersion).toBe('v2.0.0');
  });

  it('throws NOT_FOUND when the repo is not tracked', async () => {
    findTrackedRepo.mockResolvedValue(null);
    await expect(markSeen('u1', 'missing')).rejects.toBeInstanceOf(ServiceError);
  });
});

describe('previewRepo', () => {
  it('returns INVALID_URL for unparseable input without any I/O', async () => {
    const result = await previewRepo('u1', 'not a url');
    expect(result).toEqual({ status: 'INVALID_URL', owner: null, name: null });
    expect(isRepoTrackedByUser).not.toHaveBeenCalled();
    expect(fetchRepo).not.toHaveBeenCalled();
  });

  it('returns ALREADY_TRACKED before hitting GitHub', async () => {
    isRepoTrackedByUser.mockResolvedValue(true);
    const result = await previewRepo('u1', 'facebook/react');
    expect(result).toEqual({
      status: 'ALREADY_TRACKED',
      owner: 'facebook',
      name: 'react',
    });
    expect(fetchRepo).not.toHaveBeenCalled();
  });

  it('returns NOT_FOUND when GitHub cannot find the repo', async () => {
    isRepoTrackedByUser.mockResolvedValue(false);
    fetchRepo.mockResolvedValue({
      ok: false,
      error: { kind: 'NOT_FOUND', message: 'gone' },
    });
    const result = await previewRepo('u1', 'ghost/missing');
    expect(result).toEqual({
      status: 'NOT_FOUND',
      owner: 'ghost',
      name: 'missing',
    });
  });

  it('returns VALID when GitHub finds an untracked repo', async () => {
    isRepoTrackedByUser.mockResolvedValue(false);
    fetchRepo.mockResolvedValue(ghOk);
    const result = await previewRepo('u1', 'facebook/react');
    expect(result).toEqual({
      status: 'VALID',
      owner: 'facebook',
      name: 'react',
    });
  });
});

describe('listTrackedRepos', () => {
  it('passes search/filter/pagination through to the DAL', async () => {
    const connection: RepoConnectionDto = {
      nodes: [tracked()],
      totalCount: 1,
      pageInfo: { page: 1, pageSize: 10, hasNextPage: false },
    };
    listTrackedReposDal.mockResolvedValue(connection);

    const result = await listTrackedRepos({
      userId: 'u1',
      search: 'react',
      unseenOnly: true,
      languages: ['TypeScript'],
      page: 1,
      pageSize: 10,
    });

    expect(listTrackedReposDal).toHaveBeenCalledWith({
      userId: 'u1',
      search: 'react',
      unseenOnly: true,
      languages: ['TypeScript'],
      page: 1,
      pageSize: 10,
    });
    expect(result.totalCount).toBe(1);
  });
});
