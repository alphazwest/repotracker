import 'dotenv/config';
import { startServer } from './server.js';
import { startSyncSchedule } from './jobs/index.js';

/**
 * Backend boot shell — the composition root. It loads config, starts the
 * Apollo GraphQL server, and registers the in-process sync schedule.
 */

interface BootConfig {
  port: number;
  syncIntervalCron: string;
}

const loadConfig = (): BootConfig => ({
  port: Number(process.env.PORT ?? 4000),
  syncIntervalCron: process.env.SYNC_INTERVAL_CRON ?? '*/15 * * * *',
});

const main = async (): Promise<void> => {
  const config = loadConfig();

  // eslint-disable-next-line no-console
  console.log(
    `[boot] RepoTracker backend starting (port ${config.port}, ` +
      `sync "${config.syncIntervalCron}")`,
  );

  // Start the Apollo GraphQL server. Resolvers stay thin and call into
  // services/.
  const { url } = await startServer({ port: config.port });
  // eslint-disable-next-line no-console
  console.log(`[boot] GraphQL ready at ${url}`);

  // Register the node-cron sync job. The job is a thin caller of
  // services/sync.ts, shared with the refresh mutations.
  startSyncSchedule({ cronExpression: config.syncIntervalCron });
  // eslint-disable-next-line no-console
  console.log(`[boot] sync schedule started ("${config.syncIntervalCron}")`);
};

main().catch((error: unknown) => {
  // eslint-disable-next-line no-console
  console.error('[boot] fatal error during startup', error);
  process.exitCode = 1;
});
