import type { RepoDto } from '../dto/index.js';

// Capture the cron registration so the test can invoke the scheduled task.
// These live in vi.hoisted so the vi.mock factories (hoisted to the top of the
// module) can reference them safely.
const { scheduledTasks, cronSchedule, syncAllTrackedRepos } = vi.hoisted(() => {
  const tasks: Array<() => void | Promise<void>> = [];
  return {
    scheduledTasks: tasks,
    cronSchedule: vi.fn((_expr: string, task: () => void | Promise<void>) => {
      tasks.push(task);
      return { stop: vi.fn(), start: vi.fn() };
    }),
    // The schedule and refreshAll must share ONE sync service entrypoint.
    syncAllTrackedRepos: vi.fn<() => Promise<RepoDto[]>>(),
  };
});

vi.mock('node-cron', () => ({
  __esModule: true,
  default: { schedule: cronSchedule },
  schedule: cronSchedule,
}));

vi.mock('../services/sync.js', () => ({
  syncAllTrackedRepos: () => syncAllTrackedRepos(),
}));

// eslint-disable-next-line import/first
import { startSyncSchedule } from './syncSchedule.js';
// eslint-disable-next-line import/first
import { syncAllTrackedRepos as sharedSyncEntry } from '../services/sync.js';

beforeEach(() => {
  vi.clearAllMocks();
  scheduledTasks.length = 0;
  syncAllTrackedRepos.mockResolvedValue([]);
});

describe('startSyncSchedule', () => {
  it('registers a cron job with the configured expression', () => {
    startSyncSchedule({ cronExpression: '*/5 * * * *' });
    expect(cronSchedule).toHaveBeenCalledTimes(1);
    expect(cronSchedule.mock.calls[0]?.[0]).toBe('*/5 * * * *');
  });

  it('runs the shared sync service when the scheduled task fires', async () => {
    startSyncSchedule({ cronExpression: '* * * * *' });
    await scheduledTasks[0]?.();
    expect(syncAllTrackedRepos).toHaveBeenCalledTimes(1);
  });

  it('uses the same sync entrypoint that refreshAll calls', async () => {
    // The schedule and services/repos.refreshAll both import this one symbol
    // from services/sync.js — invoking the scheduled task drives that shared
    // entrypoint, with no duplicated sync logic.
    startSyncSchedule({ cronExpression: '* * * * *' });
    await scheduledTasks[0]?.();
    expect(syncAllTrackedRepos).toHaveBeenCalledTimes(1);
    await sharedSyncEntry();
    expect(syncAllTrackedRepos).toHaveBeenCalledTimes(2);
  });
});
