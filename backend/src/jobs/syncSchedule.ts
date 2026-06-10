import cron from 'node-cron';
import { syncAllTrackedRepos } from '../services/sync.js';

/** A handle to a running schedule; `stop()` cancels future runs. */
export interface ScheduleHandle {
  stop: () => void;
}

export interface SyncScheduleOptions {
  /** Cron expression controlling the sweep cadence (config.syncIntervalCron). */
  cronExpression: string;
}

/**
 * Register the in-process sync sweep. On each tick it calls
 * {@link syncAllTrackedRepos} — the SAME business-layer entrypoint the
 * `refreshAll` mutation uses, so scheduled and on-demand syncs share one code
 * path. A run never throws out of the scheduler; failures are logged and the
 * next tick proceeds.
 */
export const startSyncSchedule = (
  options: SyncScheduleOptions,
): ScheduleHandle => {
  const task = cron.schedule(options.cronExpression, async () => {
    try {
      const synced = await syncAllTrackedRepos();
      // eslint-disable-next-line no-console
      console.log(`[sync] swept ${synced.length} tracked repo(s)`);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[sync] scheduled sweep failed', error);
    }
  });

  return { stop: () => task.stop() };
};
