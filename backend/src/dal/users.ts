import { getPrisma } from '../prisma.js';
import type { UserDto } from '../dto/index.js';

/** The implicit single-tenant demo user's stable handle. */
const DEMO_USER_HANDLE = 'demo';

const mapUserRowToDto = (row: {
  id: string;
  handle: string;
  createdAt: Date;
}): UserDto => ({
  id: row.id,
  handle: row.handle,
  createdAt: row.createdAt,
});

/**
 * Ensure the implicit demo user exists and return it. Idempotent — the BAL
 * calls this to resolve the userId for the no-auth demo tenancy.
 */
export const ensureDemoUser = async (): Promise<UserDto> => {
  const row = await getPrisma().user.upsert({
    where: { handle: DEMO_USER_HANDLE },
    create: { handle: DEMO_USER_HANDLE },
    update: {},
  });
  return mapUserRowToDto(row);
};
