import { expect, test } from '@playwright/test';

test('compares timing strategies and copies one into an independent manual schedule', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Skenaariovertailu', exact: true })).toBeVisible();
  await expect(page.getByTestId('strategy-early')).toContainText('S2: päätehakkuu vuonna 6');
  await expect(page.getByTestId('strategy-delayed')).toContainText('S1: päätehakkuu vuonna 6');
  await expect(page.getByTestId('strategy-staggered')).toContainText('S2: päätehakkuu vuonna 11');
  const comparison = page.getByRole('region', { name: 'Skenaarioiden vuotuinen vertailu', exact: true });
  await expect(comparison.locator('tbody tr')).toHaveCount(21);
  const earlyYear1 = await comparison.locator('tbody tr').nth(1).locator('td').nth(1).textContent();
  const delayedYear1 = await comparison.locator('tbody tr').nth(1).locator('td').nth(2).textContent();
  expect(earlyYear1).not.toBe(delayedYear1);
  await page.getByRole('button', { name: 'Kopioi B · Viivästetty omaan aikatauluun', exact: true }).click();
  await expect(page.getByLabel('Kuvion S1 hakkuuvuosi', { exact: true })).toHaveValue('6');
  await expect(page.getByLabel('Kuvion S2 hakkuuvuosi', { exact: true })).toHaveValue('11');
  await page.getByLabel('Kuvion S1 hakkuuvuosi', { exact: true }).fill('4');
  await expect(page.getByTestId('strategy-delayed')).toContainText('S1: päätehakkuu vuonna 6');
  await expect(comparison.locator('tbody tr').nth(1).locator('td').nth(1)).toHaveText(earlyYear1!);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('edits thinning percentages and a later final harvest with visible illegal-event errors', async ({ page }) => {
  await page.goto('/');
  const harvest = page.getByLabel('Kuvion S1 hakkuu', { exact: true });
  await harvest.selectOption('thinning');
  const removal = page.getByLabel('Kuvion S1 poistuma (%)', { exact: true });
  await removal.fill('25');
  await expect(page.getByRole('main').getByRole('alert')).toHaveCount(0);
  const before = await page.getByTestId('npv').textContent();
  await removal.fill('50');
  await expect(page.getByTestId('npv')).not.toHaveText(before!);
  await removal.fill('100');
  await expect(page.getByRole('main').getByRole('alert')).toContainText('alle 100 %');
  await expect(page.getByTestId('npv')).toHaveCount(0);
  await removal.fill('25');
  await page.getByRole('button', { name: 'Lisää hakkuu kuviolle S1', exact: true }).click();
  await page.getByLabel('Kuvion S1 hakkuu 2', { exact: true }).selectOption('final');
  await page.getByLabel('Kuvion S1 hakkuuvuosi 2', { exact: true }).fill('1');
  await expect(page.getByRole('main').getByRole('alert')).toContainText('samalle vuodelle');
  await page.getByLabel('Kuvion S1 hakkuuvuosi 2', { exact: true }).fill('3');
  await expect(page.getByRole('main').getByRole('alert')).toHaveCount(0);
  await page.getByRole('button', { name: 'Lisää hakkuu kuviolle S1', exact: true }).click();
  await expect(page.getByRole('main').getByRole('alert')).toContainText('kiertoajan');
  await page.getByLabel('Kuvion S1 hakkuu 3', { exact: true }).selectOption('none');
  await expect(page.getByRole('main').getByRole('alert')).toHaveCount(0);
});

test('reports unavailable generated schedules without discarding events and respects development classes', async ({ page }, testInfo) => {
  await page.goto('/');
  await page.getByRole('combobox', { name: 'Sijoitusaika (vuotta)', exact: true }).selectOption('10');
  await expect(page.getByTestId('strategy-delayed')).toContainText('Ei laskettavissa');
  await expect(page.getByTestId('strategy-delayed')).toContainText('vuonna 11');
  await expect(page.getByTestId('strategy-delayed').getByRole('button')).toHaveCount(0);
  await expect(page.getByTestId('npv')).toBeVisible();
  await page.getByLabel('Kuvion S2 kehitysluokka', { exact: true }).selectOption('young');
  await expect(page.getByTestId('strategy-early')).toContainText('nuori metsä tai taimikko');
  await page.getByLabel('Kuvion S1 kehitysluokka', { exact: true }).selectOption('young');
  await expect(page.getByTestId('strategy-early')).toContainText('Ei suunniteltuja hakkuita');
  await page.getByRole('heading', { name: 'Skenaariovertailu', exact: true }).scrollIntoViewIfNeeded();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('comparison.png') });
});
