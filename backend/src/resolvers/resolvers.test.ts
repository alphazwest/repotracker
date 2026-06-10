import { makeTrackedRepoDto } from '../test/factories.js';
import type { RepoConnectionDto } from '../dto/index.js';

// Mock the BAL: the resolver suite asserts wiring + DTO→schema mapping + typed
// errors, not business rules (covered in services tests). No DB is touched.
const trackRepo = vi.fn();
const untrackRepo = vi.fn();
const markSeen = vi.fn();
const refreshRepo = vi.fn();
const refreshAll = vi.fn();
const listTrackedRepos = vi.fn();
const previewRepo = vi.fn();

vi.mock('../services/repos.js', async () => {
  // Re-export the real ServiceError (from the dep-free errors module, so this
  // mock factory never loads the ESM Octokit client transitively) — the
  // resolver's `instanceof ServiceError` check must see the real class.
  const { ServiceError: RealServiceError } =
    await vi.importActual<typeof import('../services/errors.js')>(
      '../services/errors.js',
    );
  return {
    ServiceError: RealServiceError,
    trackRepo: (...a: unknown[]) => trackRepo(...a),
    untrackRepo: (...a: unknown[]) => untrackRepo(...a),
    markSeen: (...a: unknown[]) => markSeen(...a),
    refreshRepo: (...a: unknown[]) => refreshRepo(...a),
    refreshAll: (...a: unknown[]) => refreshAll(...a),
    listTrackedRepos: (...a: unknown[]) => listTrackedRepos(...a),
    previewRepo: (...a: unknown[]) => previewRepo(...a),
  };
});

// eslint-disable-next-line import/first
import { createApolloServer } from '../server.js';
// eslint-disable-next-line import/first
import { ServiceError } from '../services/errors.js';

const tracked = makeTrackedRepoDto;

const server = createApolloServer();
const ctx = { userId: 'u1' };

interface RunResult {
  data: Record<string, unknown> | null;
  errors: unknown[] | undefined;
}

const run = async (
  query: string,
  variables: Record<string, unknown> = {},
): Promise<RunResult> => {
  const res = await server.executeOperation(
    { query, variables },
    { contextValue: ctx },
  );
  if (res.body.kind !== 'single') {
    throw new Error('expected a single result');
  }
  return {
    data: (res.body.singleResult.data as Record<string, unknown>) ?? null,
    errors: res.body.singleResult.errors as unknown[] | undefined,
  };
};

beforeEach(() => vi.clearAllMocks());

describe('mutation: trackRepo', () => {
  it('returns the updated Repo (id + changed fields) for the cache to patch', async () => {
    trackRepo.mockResolvedValue(tracked({ unseen: true }));
    const { data, errors } = await run(
      `mutation($url: String!) {
        trackRepo(url: $url) {
          id owner name stars unseen latestReleaseVersion lastSyncedAt
          languages { name color }
        }
      }`,
      { url: 'https://github.com/facebook/react' },
    );
    expect(errors).toBeUndefined();
    expect(data?.trackRepo).toMatchObject({
      id: 'r1',
      owner: 'facebook',
      stars: 100,
      unseen: true,
      latestReleaseVersion: 'v2.0.0',
      languages: [{ name: 'TypeScript', color: '#3178c6' }],
    });
    expect(trackRepo).toHaveBeenCalledWith(
      'u1',
      'https://github.com/facebook/react',
    );
  });

  it('surfaces a typed GraphQL error for a bad URL', async () => {
    trackRepo.mockRejectedValue(new ServiceError('INVALID_URL', 'bad url'));
    const { data, errors } = await run(
      'mutation($url: String!) { trackRepo(url: $url) { id } }',
      { url: 'nope' },
    );
    expect(data).toBeNull();
    expect(errors?.[0]).toMatchObject({
      message: 'bad url',
      extensions: { code: 'INVALID_URL' },
    });
  });

  it('surfaces a typed error for a duplicate (already tracked)', async () => {
    trackRepo.mockRejectedValue(
      new ServiceError('ALREADY_TRACKED', 'already tracked'),
    );
    const { errors } = await run(
      'mutation($url: String!) { trackRepo(url: $url) { id } }',
      { url: 'https://github.com/a/b' },
    );
    expect(errors?.[0]).toMatchObject({ extensions: { code: 'ALREADY_TRACKED' } });
  });
});

describe('mutation: markSeen', () => {
  it('returns the updated Repo with unseen=false', async () => {
    markSeen.mockResolvedValue(tracked({ unseen: false }));
    const { data, errors } = await run(
      'mutation($id: ID!) { markSeen(repoId: $id) { id unseen } }',
      { id: 'r1' },
    );
    expect(errors).toBeUndefined();
    expect(data?.markSeen).toEqual({ id: 'r1', unseen: false });
    expect(markSeen).toHaveBeenCalledWith('u1', 'r1');
  });
});

describe('query: trackedRepos', () => {
  it('returns the connection; totalCount + pageInfo from the same result', async () => {
    const connection: RepoConnectionDto = {
      nodes: [tracked(), tracked({ id: 'r2', owner: 'vuejs', name: 'core' })],
      totalCount: 2,
      pageInfo: { page: 1, pageSize: 10, hasNextPage: false },
    };
    listTrackedRepos.mockResolvedValue(connection);
    const { data, errors } = await run(
      `query($search: String, $filter: RepoFilter, $page: Int, $pageSize: Int) {
        trackedRepos(search: $search, filter: $filter, page: $page, pageSize: $pageSize) {
          nodes { id owner }
          totalCount
          pageInfo { page pageSize hasNextPage }
        }
      }`,
      { search: 'core', filter: { unseenOnly: true, languages: ['TypeScript'] } },
    );
    expect(errors).toBeUndefined();
    const conn = data?.trackedRepos as RepoConnectionDto;
    expect(conn.totalCount).toBe(2);
    expect(conn.nodes).toHaveLength(2);
    expect(conn.pageInfo).toEqual({ page: 1, pageSize: 10, hasNextPage: false });
    // search + filter forwarded to the BAL (single shared where downstream).
    expect(listTrackedRepos).toHaveBeenCalledWith({
      userId: 'u1',
      search: 'core',
      unseenOnly: true,
      languages: ['TypeScript'],
      page: 1,
      pageSize: 10,
    });
  });
});

describe('query: previewRepo', () => {
  it('maps the preview DTO to schema and forwards userId + url', async () => {
    previewRepo.mockResolvedValue({
      status: 'VALID',
      owner: 'facebook',
      name: 'react',
    });
    const { data, errors } = await run(
      'query($url: String!) { previewRepo(url: $url) { status owner name } }',
      { url: 'facebook/react' },
    );
    expect(errors).toBeUndefined();
    expect(data?.previewRepo).toEqual({
      status: 'VALID',
      owner: 'facebook',
      name: 'react',
    });
    expect(previewRepo).toHaveBeenCalledWith('u1', 'facebook/react');
  });
});
