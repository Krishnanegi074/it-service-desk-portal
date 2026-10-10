import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

async function expectNoSeriousAccessibilityViolations(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  const seriousViolations = results.violations.filter(
    violation => violation.impact === 'serious' || violation.impact === 'critical'
  );
  expect(seriousViolations, JSON.stringify(seriousViolations, null, 2)).toEqual([]);
}

test('employee intake reaches the engineer workflow', async ({ page }) => {
  const title = `E2E VPN outage ${Date.now()}`;
  const internalNote = 'E2E verification: gateway logs reviewed.';

  await page.goto('/report');
  await expect(page.getByRole('heading', { name: 'Report an IT issue' })).toBeVisible();
  await expectNoSeriousAccessibilityViolations(page);
  await page.getByLabel('Short title').fill(title);
  await page.getByLabel('Describe the problem').fill(
    'The corporate VPN disconnects immediately after authentication from home Wi-Fi.'
  );
  await page.getByLabel('Are you connected through home Wi-Fi, office Ethernet, or a mobile hotspot?')
    .fill('Home Wi-Fi');
  await page.getByLabel('What exact error message does the VPN display?').fill('AUTH_TIMEOUT');
  await expect(page.getByText('100%')).toBeVisible();
  await page.getByRole('button', { name: 'Submit incident' }).click();

  await expect(page).toHaveURL(/\/report\/[0-9a-f-]+\/success$/);
  await expect(page.getByRole('heading', { name: 'Your issue has been sent to the IT queue.' }))
    .toBeVisible();
  await expect(page.getByText(title)).toBeVisible();
  await expectNoSeriousAccessibilityViolations(page);

  await page.getByRole('link', { name: 'View ticket status' }).click();
  await expect(page.getByRole('heading', { name: title })).toBeVisible();
  await expectNoSeriousAccessibilityViolations(page);

  await page.goto('/console');
  await page.getByRole('textbox', { name: 'Search incidents' }).fill(title);
  await page.getByRole('button', { name: 'Search', exact: true }).click();
  await expect(page.getByRole('button', { name: new RegExp(title) })).toBeVisible();
  await page.getByRole('button', { name: new RegExp(title) }).click();

  const drawer = page.getByRole('dialog', { name: title });
  await expect(drawer.getByRole('heading', { name: 'Jira delivery' })).toBeVisible();
  await expectNoSeriousAccessibilityViolations(page);
  await expect(drawer.getByText(/jira · pending/)).toBeVisible();
  await drawer.getByLabel('Assignee').selectOption({ label: 'Demo Administrator · admin' });
  await expect(drawer.getByText('Assigned to Demo Administrator')).toBeVisible();
  await drawer.getByLabel('Status').selectOption('in_triage');
  await expect(drawer.getByText('Status changed from open to in triage')).toBeVisible();
  await drawer.getByPlaceholder('Add troubleshooting context for engineers…').fill(internalNote);
  await drawer.getByRole('button', { name: 'Add internal note' }).click();
  await expect(drawer.getByText(internalNote)).toBeVisible();

  await drawer.getByLabel('Routing quality').selectOption({ label: 'Accurate as submitted' });
  await drawer.getByLabel('Clarification contacts').fill('1');
  await drawer.getByRole('button', { name: 'Save pilot feedback' }).click();
  await expect(drawer.getByText('Pilot feedback saved.')).toBeVisible();

  await page.goto('/admin/pilot');
  await expect(page.getByRole('heading', { name: 'Service-desk outcome dashboard' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Routing accuracy' })).toBeVisible();
  await expect(page.getByText(/incidents with engineer feedback: 100%/i)).toBeVisible();
  await expectNoSeriousAccessibilityViolations(page);
});

test('console remains usable at a mobile viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/console');
  await expect(page.getByRole('heading', { name: 'IT Pre-Triage Engineering Console' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Incident queue filters' })).toBeVisible();
  await expectNoSeriousAccessibilityViolations(page);
  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth
  );
  expect(hasHorizontalOverflow).toBe(false);
});
