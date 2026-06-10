import { GraphQLError } from 'graphql';
import { ServiceError } from '../services/errors.js';

/**
 * Run a BAL call and translate a {@link ServiceError} into a typed GraphQL
 * error (code in `extensions.code`) so the client can branch on the failure.
 * Other throws propagate as INTERNAL_SERVER_ERROR.
 */
export const handle = async <T>(fn: () => Promise<T>): Promise<T> => {
  try {
    return await fn();
  } catch (error) {
    if (error instanceof ServiceError) {
      throw new GraphQLError(error.message, {
        extensions: { code: error.kind },
      });
    }
    throw error;
  }
};
