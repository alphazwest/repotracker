import { ApolloClient, HttpLink } from '@apollo/client';
import { createCache } from './cache';

const GRAPHQL_URL = import.meta.env.VITE_GRAPHQL_URL ?? 'http://localhost:4000/';

/**
 * The single Apollo Client for the app, backed by the normalized cache. Reads
 * the endpoint from `VITE_GRAPHQL_URL` (see `.env.example`).
 */
const createApolloClient = (): ApolloClient =>
  new ApolloClient({
    link: new HttpLink({ uri: GRAPHQL_URL }),
    cache: createCache(),
  });

export const apolloClient = createApolloClient();
