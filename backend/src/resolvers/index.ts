import { queryResolvers, dateTimeScalar } from './repo.js';
import { mutationResolvers } from './mutations.js';

/** Assembled resolver map for the schema. */
export const resolvers = {
  DateTime: dateTimeScalar,
  Query: queryResolvers.Query,
  Mutation: mutationResolvers.Mutation,
};

export type { GraphQLContext } from './context.js';
