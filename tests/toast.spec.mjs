import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => { await page.goto('/tests/fixture.html'); });

test('a message is text, not markup, unless allowHtml is set', async ({ page }) => {
  const result = await page.evaluate(async () => {
    window.executed = false;
    const hostile = '<img src=x onerror="window.executed = true">';
    const el = toast('Welcome, ' + hostile, { duration: 0 });
    await new Promise((r) => setTimeout(r, 400));
    return { executed: window.executed, shown: el.querySelector('.ts-toast-body').textContent };
  });
  expect(result.executed).toBe(false);
  expect(result.shown).toContain('<img src=x');
});

test('allowHtml: true still renders markup the caller wrote', async ({ page }) => {
  const html = await page.evaluate(async () => {
    const el = toast('Saved <b>file.pdf</b>', { duration: 0, allowHtml: true });
    await new Promise((r) => setTimeout(r, 300));
    return el.querySelector('.ts-toast-body').innerHTML;
  });
  expect(html).toContain('<b>file.pdf</b>');
});

test('every shorthand exists and returns the element', async ({ page }) => {
  const kinds = await page.evaluate(() =>
    ['success', 'error', 'warning', 'info'].map((k) => ({
      name: k,
      returns: toast[k]('x', { duration: 0 }) instanceof HTMLElement,
    })));
  expect(kinds.every((k) => k.returns)).toBe(true);
});

test('update keeps the toast visible and honours duration: 0', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const handle = toast.loading('Uploading…');
    await new Promise((r) => setTimeout(r, 400));
    handle.update('Done', { type: 'success', duration: 0 });
    await new Promise((r) => setTimeout(r, 1600));
    const el = document.querySelector('.ts-toast');
    return { stillThere: !!el, classes: el ? [...el.classList] : [] };
  });
  expect(result.stillThere).toBe(true);
  expect(result.classes).toContain('ts-toast-show');
  expect(result.classes).toContain('ts-toast-success');
});

test('update rebinds onDismiss instead of firing both callbacks', async ({ page }) => {
  const calls = await page.evaluate(async () => {
    let original = 0, updated = 0;
    const el = toast('y', { duration: 0, onDismiss: () => original++ });
    await new Promise((r) => setTimeout(r, 300));
    toast.update(el, 'z', { type: 'success', duration: 0, onDismiss: () => updated++ });
    await new Promise((r) => setTimeout(r, 300));
    el.close();
    await new Promise((r) => setTimeout(r, 900));
    return { original, updated };
  });
  expect(calls).toEqual({ original: 0, updated: 1 });
});

test('hovering freezes the countdown', async ({ page }) => {
  // Long enough that the entry animation finishes before the countdown matters:
  // hover() waits for the element to stop moving.
  await page.evaluate(() => { window.el = toast('hover me', { duration: 2000 }); });
  await page.waitForTimeout(700);
  await page.locator('.ts-toast').hover();
  await page.waitForTimeout(2600);
  await expect(page.locator('.ts-toast')).toHaveCount(1);   // held while hovered

  await page.mouse.move(0, 0);
  await page.waitForTimeout(2600);
  await expect(page.locator('.ts-toast')).toHaveCount(0);   // resumes on leave
});

test('onClick fires on the click, not after the exit animation', async ({ page }) => {
  const delay = await page.evaluate(async () => {
    let firedAt = 0;
    const el = toast('x', { duration: 0, onClick: () => { firedAt = performance.now(); } });
    await new Promise((r) => setTimeout(r, 400));
    const clickedAt = performance.now();
    el.click();
    await new Promise((r) => setTimeout(r, 100));
    return firedAt - clickedAt;
  });
  expect(delay).toBeLessThan(50);
});

test('toast.promise resolves with the value and re-throws the failure', async ({ page }) => {
  const ok = await page.evaluate(() =>
    toast.promise(Promise.resolve({ id: 7 }), { success: (v) => `Saved #${v.id}` }));
  expect(ok).toEqual({ id: 7 });

  const failure = await page.evaluate(async () => {
    try {
      await toast.promise(Promise.reject(new Error('nope')), { error: (e) => e.message });
      return 'did not throw';
    } catch (e) { return e.message; }
  });
  expect(failure).toBe('nope');
});

test('an action button runs its callback and closes the toast', async ({ page }) => {
  await page.evaluate(() => {
    window.undone = false;
    toast('Deleted', { duration: 0, action: { text: 'Undo', onClick: () => { window.undone = true; } } });
  });
  await page.locator('.ts-toast-action').click();
  await page.waitForTimeout(800);
  expect(await page.evaluate(() => window.undone)).toBe(true);
  await expect(page.locator('.ts-toast')).toHaveCount(0);
});

test('the progress bar runs for the toast duration and pauses on hover', async ({ page }) => {
  await page.evaluate(() => toast('x', { duration: 3000, showProgress: true }));
  const bar = page.locator('.ts-toast-progress');
  await bar.waitFor();
  expect(await bar.evaluate((b) => getComputedStyle(b).animationDuration)).toBe('3s');
  await page.locator('.ts-toast').hover();
  await page.waitForTimeout(200);
  expect(await bar.evaluate((b) => getComputedStyle(b).animationPlayState)).toBe('paused');
});

test('dismissAll clears the toasts and their containers', async ({ page }) => {
  await page.evaluate(() => { ['info', 'success'].forEach((t) => toast(t, { type: t, duration: 0 })); });
  await expect(page.locator('.ts-toast')).toHaveCount(2);
  await page.evaluate(() => toast.dismissAll());
  await page.waitForTimeout(900);
  await expect(page.locator('.ts-toast')).toHaveCount(0);
  await expect(page.locator('.ts-toast-container')).toHaveCount(0);
});

test('position: center puts the toast in the middle of the viewport', async ({ page }) => {
  await page.evaluate(() => toast('centred', { position: 'center', duration: 0 }));
  const el = page.locator('.ts-toast');
  await el.waitFor();
  await page.waitForTimeout(600);
  const box = await el.boundingBox();
  const size = await page.evaluate(() => ({ w: innerWidth, h: innerHeight }));
  expect(Math.abs((box.x + box.width / 2) - size.w / 2)).toBeLessThan(2);
  expect(Math.abs((box.y + box.height / 2) - size.h / 2)).toBeLessThan(2);
});

test('icons are inline SVG and cost no network requests', async ({ page }) => {
  const requests = [];
  page.on('request', (r) => requests.push(r.url()));
  await page.evaluate(async () => {
    ['success', 'error', 'info', 'warning'].forEach((t) => toast(t, { type: t, duration: 0 }));
    await new Promise((r) => setTimeout(r, 500));
  });
  await expect(page.locator('.ts-toast-icon svg')).toHaveCount(4);
  expect(requests.filter((u) => /\.(gif|png)(\?|$)/.test(u))).toHaveLength(0);
});

test('error and warning toasts are announced assertively', async ({ page }) => {
  await page.evaluate(() => { toast.error('boom', { duration: 0 }); });
  await expect(page.locator('.ts-toast-error')).toHaveAttribute('role', 'alert');
  await expect(page.locator('.ts-toast-container')).toHaveAttribute('aria-live', 'polite');
});
