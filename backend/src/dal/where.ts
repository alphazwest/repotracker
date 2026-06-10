import type { Prisma } from '@prisma/client';
import type { LanguageDto, ListReposInput } from '../dto/index.js';

/**
 * Filter construction for the tracked-repos list. The query roots on UserRepo
 * (the per-user tenancy edge) and joins the shared Repo row.
 *
 * Two parts:
 *  - {@link buildUserRepoWhere} — the DB-expressible filter (userId + search),
 *    built ONCE and fed to both `findMany` and `count` so totals never drift.
 *  - {@link matchesUnseenOnly} / {@link matchesLanguages} — predicates for the
 *    parts Prisma cannot express portably (cross-column unseen comparison, JSON
 *    array membership). The DAL applies these to the joined result; because the
 *    same predicates drive both the count and the page slice, totals stay
 *    consistent.
 */
export const buildUserRepoWhere = (
  input: ListReposInput,
): Prisma.UserRepoWhereInput => {
  const where: Prisma.UserRepoWhereInput = { userId: input.userId };

  const search = input.search?.trim();
  if (search) {
    where.repo = {
      OR: [
        { owner: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ],
    };
  }

  return where;
};

/** The unseen rule: a repo with a release whose version differs from watermark. */
export const isUnseen = (
  latestReleaseVersion: string | null,
  lastSeenReleaseVersion: string | null,
): boolean =>
  latestReleaseVersion !== null
  && latestReleaseVersion !== lastSeenReleaseVersion;

/** Predicate for the `unseenOnly` filter; a no-op when the filter is unset. */
export const matchesUnseenOnly = (
  unseen: boolean,
  unseenOnly: boolean | undefined,
): boolean => (unseenOnly ? unseen : true);

/** Predicate for the languages filter; matches case-insensitively on any one. */
export const matchesLanguages = (
  languages: LanguageDto[],
  requested: string[] | undefined,
): boolean => {
  if (!requested || requested.length === 0) {
    return true;
  }
  const have = new Set(languages.map((l) => l.name.toLowerCase()));
  return requested.some((r) => have.has(r.toLowerCase()));
};
