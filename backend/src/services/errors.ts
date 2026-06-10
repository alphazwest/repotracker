import type { GitHubError } from '../github/types.js';

/** Business-rule error kinds the API maps to typed GraphQL errors. */
export type ServiceErrorKind =
  | 'INVALID_URL'
  | 'NOT_FOUND'
  | 'ALREADY_TRACKED'
  | 'GITHUB_ERROR';

/** A typed business-rule failure. The API maps `kind` to `extensions.code`. */
export class ServiceError extends Error {
  readonly kind: ServiceErrorKind;

  constructor(kind: ServiceErrorKind, message: string) {
    super(message);
    this.kind = kind;
    this.name = 'ServiceError';
  }
}

/**
 * Wrap a non-NOT_FOUND GitHub failure as a `GITHUB_ERROR` ServiceError, carrying
 * the underlying kind/message. (NOT_FOUND is handled per call site — it maps to
 * a distinct error or a preview status.)
 */
export const githubErrorToServiceError = (error: GitHubError): ServiceError =>
  new ServiceError(
    'GITHUB_ERROR',
    `GitHub error (${error.kind}): ${error.message}`,
  );
