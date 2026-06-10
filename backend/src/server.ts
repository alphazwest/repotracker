import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { typeDefs } from './schema/index.js';
import { resolvers } from './resolvers/index.js';
import type { GraphQLContext } from './resolvers/context.js';
import { ensureDemoUser } from './dal/users.js';

/** Build the Apollo Server (no transport). Used by both boot and tests. */
export const createApolloServer = (): ApolloServer<GraphQLContext> =>
  new ApolloServer<GraphQLContext>({ typeDefs, resolvers });

interface StartServerOptions {
  port: number;
}

/**
 * Start the standalone GraphQL server. Context resolves the implicit demo user
 * once per request (no auth) and injects its id; every resolver scopes to it.
 */
export const startServer = async (
  options: StartServerOptions,
): Promise<{ url: string }> => {
  const server = createApolloServer();
  const { url } = await startStandaloneServer(server, {
    listen: { port: options.port },
    context: async (): Promise<GraphQLContext> => {
      const user = await ensureDemoUser();
      return { userId: user.id };
    },
  });
  return { url };
};
