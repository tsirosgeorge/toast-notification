import { test, expect } from '@playwright/test';

// Every case here is a bug that shipped at least once. The names say what broke.

test.beforeEach(async ({ page }) => { await page.goto('/tests/fixture.html'); });

const openConfirm = (page, options = {}) =>
  page.evaluate((o) => { window.result = toast.confirm('Sure?', o); }, options);

const settled = (page) =>
  page.evaluate(() => Promise.race([
    window.result,
    new Promise((r) => setTimeout(() => r('HUNG'), 2000)),
  ]));

test('resolves when the backdrop is clicked', async ({ page }) => {
  await openConfirm(page);
  await page.locator('.ts-toast-confirm').waitFor();
  await page.locator('.ts-toast-overlay').click({ position: { x: 5, y: 5 } });
  expect(await settled(page)).toBe(false);
});

test('resolves when the close button is used', async ({ page }) => {
  await openConfirm(page, { showClose: true });
  await page.locator('.ts-toast-close').click();
  expect(await settled(page)).toBe(false);
});

test('resolves when Escape is pressed', async ({ page }) => {
  await openConfirm(page, { title: 'T' });
  await page.locator('.ts-toast-confirm').waitFor();
  await page.keyboard.press('Escape');
  expect(await settled(page)).toBe(false);
});

// Split in two: a closing dialog lingers for its exit animation, so opening the
// second one in the same test would leave two sets of buttons in the DOM.
test('confirming an empty input resolves an empty string, not a cancel', async ({ page }) => {
  await openConfirm(page, { input: 'text' });
  await page.locator('.ts-toast-btn.confirm').click();
  expect(await settled(page)).toBe('');
});

test('cancelling a dialog with an input resolves null', async ({ page }) => {
  await openConfirm(page, { input: 'text' });
  await page.locator('.ts-toast-btn.cancel').click();
  expect(await settled(page)).toBeNull();
});

test('confirming with an input resolves what was typed', async ({ page }) => {
  await openConfirm(page, { input: 'text' });
  await page.locator('.ts-toast-input').fill('notes.txt');
  await page.locator('.ts-toast-btn.confirm').click();
  expect(await settled(page)).toBe('notes.txt');
});

test('Enter submits a single-line input', async ({ page }) => {
  await openConfirm(page, { input: 'text' });
  await page.locator('.ts-toast-input').fill('via enter');
  await page.keyboard.press('Enter');
  expect(await settled(page)).toBe('via enter');
});

test('selecting text and releasing on the backdrop does not cancel', async ({ page }) => {
  await openConfirm(page, { input: 'text' });
  const input = page.locator('.ts-toast-input');
  await input.hover();
  await page.mouse.down();
  await page.mouse.move(5, 5);      // drag out of the card, onto the backdrop
  await page.mouse.up();
  await page.waitForTimeout(400);
  await expect(page.locator('.ts-toast-overlay')).toHaveCount(1);
});

test('the dialog takes focus, traps Tab and gives focus back', async ({ page }) => {
  await page.locator('#trigger').click();
  await page.locator('.ts-toast-input').waitFor();

  // The trigger must not keep focus: Enter or Space would re-open the dialog.
  await expect(page.locator('.ts-toast-input')).toBeFocused();

  const escapes = await page.evaluate(async () => {
    const dialog = document.querySelector('.ts-toast-confirm');
    const stops = [];
    for (let i = 0; i < 6; i++) {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
      stops.push(dialog.contains(document.activeElement));
    }
    return stops.some((inside) => inside === false);
  });
  expect(escapes).toBe(false);

  await page.keyboard.press('Escape');
  await page.waitForTimeout(700);
  await expect(page.locator('#trigger')).toBeFocused();
});

test('the page cannot scroll behind the dialog, and can again after', async ({ page }) => {
  await openConfirm(page, { title: 'T' });
  await page.locator('.ts-toast-confirm').waitFor();
  expect(await page.evaluate(() => document.body.style.overflow)).toBe('hidden');

  await page.keyboard.press('Escape');
  await page.waitForTimeout(700);
  expect(await page.evaluate(() => document.body.style.overflow)).toBe('');
});

test('a dialog opening over another does not dim the page twice', async ({ page }) => {
  const backdrops = await page.evaluate(async () => {
    toast.confirm('a', { title: 'A' });
    await new Promise((r) => setTimeout(r, 300));
    toast.confirm('b', { title: 'B' });
    await new Promise((r) => setTimeout(r, 500));
    return [...document.querySelectorAll('.ts-toast-overlay')]
      .map((o) => getComputedStyle(o).backgroundColor);
  });
  expect(backdrops[0]).toBe('rgba(0, 0, 0, 0.5)');
  expect(backdrops[1]).toBe('rgba(0, 0, 0, 0)');
});

test('a dialog centres on the backdrop by default', async ({ page }) => {
  await openConfirm(page, { title: 'T' });
  const card = page.locator('.ts-toast-confirm');
  await card.waitFor();
  await page.waitForTimeout(600);
  const box = await card.boundingBox();
  const width = await page.evaluate(() => innerWidth);
  expect(Math.abs((box.x + box.width / 2) - width / 2)).toBeLessThan(2);
});
