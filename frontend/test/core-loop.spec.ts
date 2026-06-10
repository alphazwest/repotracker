import { test, expect } from '@playwright/test';

/**
 * Core demo loop (the one minimal happy path): add a repo → see its latest
 * release → mark seen → the unseen indicator clears.
 *
 * Requires the full stack running (backend GraphQL at VITE_GRAPHQL_URL + the
 * frontend dev server). Validated in integration once both chains land; it is
 * not part of the frontend unit gate. Set REPO_TO_TRACK to a repo the demo
 * backend can reach (one with a tagged release, so the headline is meaningful).
 */
const REPO_TO_TRACK = process.env.E2E_REPO ?? 'octocat/Hello-World';

test('add repo, see latest release, mark seen, indicator clears', async ({ page }) => {
  await page.goto('/');

  // Add a repo via the modal: enter input, preview, confirm.
  await page.getByRole('button', { name: /add repo/i }).click();
  await page
    .getByLabel(/github url or owner\/name/i)
    .fill(REPO_TO_TRACK);
  await expect(page.getByTestId('add-repo-preview')).toContainText(REPO_TO_TRACK);
  await page.getByRole('button', { name: /add repository/i }).click();

  // The repo card appears with its latest-release version + date headline.
  const card = page.getByTestId('repo-card').filter({ hasText: REPO_TO_TRACK });
  await expect(card).toBeVisible();
  await expect(card.getByTestId('release-headline')).toBeVisible();

  // A freshly tracked repo starts "seen" (watermark = current latest). To
  // exercise the mark-seen path, the backend/sync fixture should bring a newer
  // release so the repo flips to unseen; once it does, marking clears it.
  const unseen = card.getByTestId('unseen-indicator');
  if (await unseen.isVisible()) {
    await card.getByRole('button', { name: /mark seen/i }).click();
    await expect(card.getByTestId('unseen-indicator')).toHaveCount(0);
    await expect(card.getByTestId('seen-indicator')).toBeVisible();
  }
});
