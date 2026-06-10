import { InMemoryCache } from '@apollo/client';

/**
 * Normalized cache configuration — the client-side caching strategy.
 *
 * Post-mutation update convention:
 *  - `Repo` is normalized by its `id`. Mutations that return the updated `Repo`
 *    (`markSeen`, `refreshRepo`) patch the entity in place automatically — no
 *    manual cache writes, every view re-renders from the same normalized node.
 *  - Mutations that change list membership or ordering (`trackRepo`,
 *    `untrackRepo`, `refreshAll`) can't be patched by id alone, so they refetch
 *    the tracked-repos query to re-pull the affected list. The unseen count is
 *    derived from that same cached list, so it updates without extra wiring.
 *
 * `trackedRepos` is paginated/filtered, so its field is keyed by all arguments
 * that change the result set; otherwise distinct pages/filters would clobber
 * each other in the cache.
 */
export const createCache = (): InMemoryCache =>
  new InMemoryCache({
    typePolicies: {
      Repo: { keyFields: ['id'] },
      Query: {
        fields: {
          trackedRepos: {
            keyArgs: ['search', 'filter', 'page', 'pageSize'],
          },
        },
      },
    },
  });
