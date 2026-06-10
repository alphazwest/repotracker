import {
  markSeen,
  refreshAll,
  refreshRepo,
  trackRepo,
  untrackRepo,
} from '../services/repos.js';
import { mapTrackedRepoToSchema } from '../graphql/mappers.js';
import type { RepoSchema } from '../graphql/mappers.js';
import type { GraphQLContext } from './context.js';
import { handle } from './handle.js';

export interface TrackRepoArgs {
  url: string;
}
export interface RepoIdArgs {
  repoId: string;
}

export const mutationResolvers = {
  Mutation: {
    trackRepo: (
      _parent: unknown,
      args: TrackRepoArgs,
      ctx: GraphQLContext,
    ): Promise<RepoSchema> =>
      handle(async () =>
        mapTrackedRepoToSchema(await trackRepo(ctx.userId, args.url))),

    untrackRepo: (
      _parent: unknown,
      args: RepoIdArgs,
      ctx: GraphQLContext,
    ): Promise<boolean> => handle(() => untrackRepo(ctx.userId, args.repoId)),

    markSeen: (
      _parent: unknown,
      args: RepoIdArgs,
      ctx: GraphQLContext,
    ): Promise<RepoSchema> =>
      handle(async () =>
        mapTrackedRepoToSchema(await markSeen(ctx.userId, args.repoId))),

    refreshRepo: (
      _parent: unknown,
      args: RepoIdArgs,
      ctx: GraphQLContext,
    ): Promise<RepoSchema> =>
      handle(async () =>
        mapTrackedRepoToSchema(await refreshRepo(ctx.userId, args.repoId))),

    refreshAll: (
      _parent: unknown,
      _args: unknown,
      ctx: GraphQLContext,
    ): Promise<RepoSchema[]> =>
      handle(async () =>
        (await refreshAll(ctx.userId)).map(mapTrackedRepoToSchema)),
  },
};
