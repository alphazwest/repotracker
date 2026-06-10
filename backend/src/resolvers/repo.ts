import { GraphQLError, GraphQLScalarType, Kind } from 'graphql';
import { listTrackedRepos, previewRepo } from '../services/repos.js';
import {
  mapRepoPreviewToSchema,
  mapTrackedRepoToSchema,
} from '../graphql/mappers.js';
import type { RepoPreviewSchema, RepoSchema } from '../graphql/mappers.js';
import type { GraphQLContext } from './context.js';
import { handle } from './handle.js';

/** ISO-8601 DateTime scalar. Serializes `Date` → ISO string and back. */
export const dateTimeScalar = new GraphQLScalarType({
  name: 'DateTime',
  description: 'An ISO-8601 date-time string',
  serialize(value: unknown): string | null {
    if (value === null || value === undefined) {
      return null;
    }
    if (value instanceof Date) {
      return value.toISOString();
    }
    throw new GraphQLError('DateTime must serialize a Date');
  },
  parseValue(value: unknown): Date | null {
    if (typeof value === 'string') {
      return new Date(value);
    }
    throw new GraphQLError('DateTime must be an ISO-8601 string');
  },
  parseLiteral(ast): Date | null {
    if (ast.kind === Kind.STRING) {
      return new Date(ast.value);
    }
    throw new GraphQLError('DateTime must be an ISO-8601 string');
  },
});

export interface TrackedReposArgs {
  search?: string | null;
  filter?: { unseenOnly?: boolean | null; languages?: string[] | null } | null;
  page?: number | null;
  pageSize?: number | null;
}

export interface RepoConnectionSchema {
  nodes: RepoSchema[];
  totalCount: number;
  pageInfo: { page: number; pageSize: number; hasNextPage: boolean };
}

export interface PreviewRepoArgs {
  url: string;
}

export const queryResolvers = {
  Query: {
    trackedRepos: async (
      _parent: unknown,
      args: TrackedReposArgs,
      ctx: GraphQLContext,
    ): Promise<RepoConnectionSchema> => {
      const page = args.page ?? 1;
      const pageSize = args.pageSize ?? 10;
      const connection = await listTrackedRepos({
        userId: ctx.userId,
        search: args.search ?? undefined,
        unseenOnly: args.filter?.unseenOnly ?? undefined,
        languages: args.filter?.languages ?? undefined,
        page,
        pageSize,
      });
      return {
        nodes: connection.nodes.map(mapTrackedRepoToSchema),
        totalCount: connection.totalCount,
        pageInfo: connection.pageInfo,
      };
    },

    previewRepo: (
      _parent: unknown,
      args: PreviewRepoArgs,
      ctx: GraphQLContext,
    ): Promise<RepoPreviewSchema> =>
      handle(async () =>
        mapRepoPreviewToSchema(await previewRepo(ctx.userId, args.url))),
  },
};
