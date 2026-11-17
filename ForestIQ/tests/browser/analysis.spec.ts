import { test, expect } from '@playwright/test';

test('edits purchase price immediately without changing income value', async ({ page }, testInfo) => {
  const pageErrors: string[] = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Sijoitusanalyysi ilman rahoitusta' })).toBeVisible();
  const income = page.locator('dl > div').filter({ has: page.getByText('Tuottoarvo', { exact: true }) }).locator('dd');
  const previousIncome = await income.textContent();
  const previousNpv = await page.getByTestId('npv').textContent();
  await page.getByLabel('Kauppahinta (€)', { exact: true }).fill('100000');
  await expect(page.getByTestId('npv')).not.toHaveText(previousNpv!);
  await expect(income).toHaveText(previousIncome!);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  expect(pageErrors).toEqual([]);
  await page.getByRole('heading', { name: 'Sijoitusanalyysi ilman rahoitusta' }).scrollIntoViewIfNeeded();
  await page.screenshot({ path: testInfo.outputPath('results.png') });
});

test('changes harvest year and handles every holding period without dropping events', async ({ page }) => {
  await page.goto('/');
  const previous = await page.getByTestId('npv').textContent();
  await page.getByLabel('Kuvion S1 hakkuuvuosi', { exact: true }).fill('3');
  await expect(page.getByTestId('npv')).not.toHaveText(previous!);
  await page.getByRole('combobox', { name: 'Sijoitusaika (vuotta)', exact: true }).selectOption('5');
  await expect(page.getByRole('main').getByRole('alert')).toContainText('Hakkuuvuosi ylittää sijoitusajan');
  await expect(page.getByTestId('npv')).toHaveCount(0);
  await expect(page.getByLabel('Kuvion S2 hakkuuvuosi', { exact: true })).toHaveValue('6');
  await page.getByLabel('Kuvion S2 hakkuu', { exact: true }).selectOption('none');
  for (const years of [5, 10, 20, 40]) {
    await page.getByRole('combobox', { name: 'Sijoitusaika (vuotta)', exact: true }).selectOption(String(years));
    await expect(page.getByRole('main').getByRole('alert')).toHaveCount(0);
    await expect(page.getByRole('table').first().locator('tbody tr')).toHaveCount(years + 1);
  }
});

test('invalid values and harvest restrictions are visible and recoverable', async ({ page }) => {
  await page.goto('/');
  const price = page.getByLabel('Kauppahinta (€)', { exact: true });
  await price.fill('');
  await expect(page.getByRole('main').getByRole('alert')).toContainText('Kauppahinta');
  await expect(page.getByTestId('npv')).toHaveCount(0);
  await price.fill('-1');
  await expect(page.getByRole('main').getByRole('alert')).toBeVisible();
  await price.fill('150000');
  await expect(page.getByRole('main').getByRole('alert')).toHaveCount(0);
  await page.getByLabel('Kuvion S2 hakkuuvuosi', { exact: true }).fill('1');
  await expect(page.getByRole('main').getByRole('alert')).toContainText('aikaisintaan vuonna 6');
  await page.getByLabel('Kuvion S2 hakkuuvuosi', { exact: true }).fill('6');
  await page.getByRole('combobox', { name: 'Hakkuurajoitus', exact: true }).first().selectOption('no-harvest');
  await expect(page.getByRole('main').getByRole('alert')).toContainText('hakkuurajoitus estää päätehakkuun');
  await page.getByLabel('Kuvion S1 hakkuu', { exact: true }).selectOption('none');
  await expect(page.getByRole('main').getByRole('alert')).toHaveCount(0);
  await expect(page.getByTestId('npv')).toBeVisible();
});

test('updates stand inventory and shows an accessible scrollable annual ledger', async ({ page }) => {
  await page.goto('/');
  const oldNpv = await page.getByTestId('npv').textContent();
  await page.getByLabel('Puuston tilavuus (m³/ha)', { exact: true }).first().fill('100');
  await expect(page.getByTestId('npv')).not.toHaveText(oldNpv!);
  await page.getByText('Puuston vuosittainen taselaskelma kuvioittain', { exact: true }).click();
  await expect(page.getByRole('table').nth(1).locator('tbody tr')).toHaveCount(60);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
