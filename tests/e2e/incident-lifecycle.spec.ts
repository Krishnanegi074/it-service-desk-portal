import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

async function expectNoSeriousAccessibilityViolations(page: Page) {
  // Scroll reveals start faint and finish fully visible; audit the finished state.
  await page.evaluate(() => document.querySelectorAll('.rv-h, .rv-b').forEach(el => el.classList.add('rv-in')));
  await page.waitForTimeout(1200);
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  const seriousViolations = results.violations.filter(
    violation => violation.impact === 'serious' || violation.impact === 'critical'
  );
  expect(seriousViolations, JSON.stringify(seriousViolations, null, 2)).toEqual([]);
}

test('product homepage explains the workflow and remains responsive', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1, name: /Every IT ticket, resolver/ })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Try the guided intake' }).first()).toHaveAttribute('href', '/report');
  await expect(page.getByRole('heading', { name: 'Four steps. Zero back‑and‑forth.' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'One good intake becomes your team’s standard.' })).toBeVisible();
  await page.getByRole('tab', { name: /Credential redaction/ }).click();
  await expect(page.getByRole('tabpanel')).toContainText('[REDACTED_SECRET]');
  await expectNoSeriousAccessibilityViolations(page);

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole('heading', { level: 1, name: /Every IT ticket, resolver/ })).toBeVisible();
  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth
  );
  expect(hasHorizontalOverflow).toBe(false);
});

const marketingPages = [
  { path: '/pricing', heading: 'One price for the whole IT team.' },
  { path: '/playbooks', heading: 'Start with the questions engineers ask first.' },
  { path: '/security', heading: 'IT tickets are sensitive. We treat them that way.' },
  { path: '/getting-started', heading: 'Pick how you want to start.' },
  { path: '/privacy', heading: 'Privacy notice' },
  { path: '/terms', heading: 'Terms of use' }
];

for (const { path, heading } of marketingPages) {
  test(`marketing page ${path} renders, is accessible and fits a phone`, async ({ page }) => {
    await page.goto(path);
    await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'Primary' })).toBeVisible();
    await expectNoSeriousAccessibilityViolations(page);
    await page.setViewportSize({ width: 390, height: 844 });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    expect(overflow).toBe(false);
  });
}

test('pricing calculator and playbook filters respond to input', async ({ page }) => {
  await page.goto('/pricing');
  await page.getByRole('button', { name: /Yearly/ }).click();
  await expect(page.locator('#plans')).toContainText('$124');
  await page.locator('#per').fill('60');
  await expect(page.getByText(/You’d save/)).toBeVisible();

  await page.goto('/playbooks');
  await expect(page.getByText('Showing 16 of 16 playbooks')).toBeVisible();
  await page.getByRole('button', { name: /^Included$/ }).click();
  await expect(page.getByText('Showing 5 of 16 playbooks')).toBeVisible();
  await page.getByLabel('Search playbooks').fill('printer');
  await expect(page.getByText(/No playbooks match/)).toBeVisible();
});

test('employee intake reaches the engineer workflow', async ({ page }) => {
  const title = `E2E VPN outage ${Date.now()}`;
  const internalNote = 'E2E verification: gateway logs reviewed.';

  await page.goto('/report');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to main content' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#main-content')).toBeFocused();
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
  await expect(drawer.getByRole('button', { name: 'Close incident details' })).toBeFocused();
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

  await page.keyboard.press('Escape');
  await expect(drawer).toBeHidden();
  await expect(page.getByRole('button', { name: new RegExp(title) })).toBeFocused();

  await page.goto('/admin/pilot');
  await expect(page.getByRole('heading', { name: 'Service-desk outcome dashboard' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Routing accuracy' })).toBeVisible();
  await expect(page.getByText(/incidents with engineer feedback: 100%/i)).toBeVisible();
  await expectNoSeriousAccessibilityViolations(page);
});

test('quick intake dialog traps focus, closes with Escape, and restores focus', async ({ page }) => {
  await page.goto('/console');
  const trigger = page.getByRole('button', { name: 'Quick intake' });
  await trigger.focus();
  await trigger.click();

  const dialog = page.getByRole('dialog', { name: 'Report an IT issue' });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Close diagnostic intake' })).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(dialog.getByRole('button', { name: 'Cancel' })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(dialog.getByRole('button', { name: 'Close diagnostic intake' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
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

test('how-it-works story plays as the reader scrolls', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  const story = page.locator('#how');
  await expect(story).toHaveAttribute('data-mode', 'scroll');
  await expect(story).not.toContainText('Delivered to Jira');
  const end = await story.evaluate(el => el.getBoundingClientRect().bottom + window.scrollY - window.innerHeight - 4);
  await page.evaluate(y => window.scrollTo(0, y), end);
  await expect(story).toContainText('Delivered to Jira');
  await expect(story).toContainText('[REDACTED_SECRET]');
  await expect(story).not.toContainText('Summer2026!');
});
