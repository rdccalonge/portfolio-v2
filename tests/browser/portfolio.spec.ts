import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
const content = JSON.parse(readFileSync('.local/public-content.json', 'utf8'));
test('static home works and exposes no CMS/admin link', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto('./'); await expect(page.getByRole('heading', { name: content.profile.name + '.' })).toBeVisible();
  if (content.profile.photo) await expect.poll(() => page.locator('.hero-portrait img').evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBeTruthy();
  await page.getByRole('button', { name: 'Pause animations' }).click(); await expect(page.locator('.motion-stage')).toHaveAttribute('data-motion', 'paused');
  if (content.projects.length) {
    const query = content.projects[0].title.toLowerCase();
    await page.getByRole('textbox', { name: 'Search projects' }).fill(query);
    const matches = content.projects.filter((p: any) => `${p.title} ${p.category} ${p.technologies.join(' ')}`.toLowerCase().includes(query));
    await expect(page.locator('.project-card')).toHaveCount(matches.length);
  }
  await expect(page.locator('a[href*="pagescms.org"]')).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy(); expect(errors).toEqual([]);
});
test('project route exists on static server and survives direct refresh', async ({ page }) => {
  test.skip(!content.projects.length, 'No published projects to inspect.');
  const project = content.projects[0];
  const response = await page.goto(`projects/${project.id}/`); expect(response?.status()).toBe(200);
  await expect(page.getByRole('heading', { name: project.title, exact: true })).toBeVisible();
  await page.reload(); await expect(page.getByRole('heading', { name: project.title, exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Back to work' }).click(); await expect(page.locator('.project-card')).toHaveCount(content.projects.length);
});
test('reduced motion stays readable and CV downloads exist', async ({ page, request }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' }); await page.goto('./');
  await expect(page.locator('.motion-stage')).toHaveAttribute('data-motion', 'paused');
  for (const format of ['PDF', 'Word']) await expect(page.getByRole('link', { name: `Download CV · ${format}` })).toBeVisible();
  const pdf = await request.get('downloads/reni-calonge-cv.pdf'); expect(pdf.status()).toBe(200); expect((await pdf.body()).subarray(0, 4).toString()).toBe('%PDF');
  const word = await request.get('downloads/reni-calonge-cv.docx'); expect(word.status()).toBe(200); expect((await word.body()).subarray(0, 2).toString()).toBe('PK');
});
test('CMS layer collection drives system cards and project filters', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' }); await page.goto('./');
  await expect(page.locator('.system-node')).toHaveCount(content.layers.length);
  for (const layer of content.layers) {
    await expect(page.locator('.systems-map').getByRole('heading', { name: layer.name, exact: true })).toBeVisible();
    await page.locator('.filter-tabs').getByRole('button', { name: layer.name, exact: true }).click();
    await expect(page.locator('.project-card')).toHaveCount(content.projects.filter((project: any) => project.layers.includes(layer.name)).length);
  }
});
test('approved experience and certifications appear on the portfolio', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' }); await page.goto('./');
  for (const entry of content.experience) await expect(page.locator('.timeline').getByRole('heading', { name: entry.title, exact: true })).toBeVisible();
  for (const cert of content.certifications ?? []) await expect(page.locator('.certification-list').getByRole('heading', { name: cert.name, exact: true })).toBeVisible();
});
test('project screenshots load on their static pages', async ({ page, request }) => {
  for (const project of content.projects.filter((project: any) => project.screenshots.length)) {
    await page.goto(`projects/${project.id}/`);
    await expect(page.locator('.gallery-thumbnails img')).toHaveCount(project.screenshots.length);
    for (const shot of project.screenshots) expect((await request.get(shot.src)).status()).toBe(200);
    await expect.poll(() => page.locator('figure img').first().evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBeTruthy();
  }
});

test('screenshot gallery supports selection, keyboard viewer and focus restoration', async ({ page }) => {
  const project = content.projects.find((p: any) => p.screenshots.length > 1);
  test.skip(!project, 'No gallery available.');
  await page.goto(`projects/${project.id}/`);
  await page.getByRole('button', { name: 'Show screenshot 2', exact: true }).click();
  await expect(page.locator('.gallery-open img')).toHaveAttribute('src', new RegExp(project.screenshots[1].src + '$'));
  const opener = page.getByRole('button', { name: 'Open screenshot full screen' });
  await opener.click();
  const viewer = page.getByRole('dialog', { name: 'Screenshot viewer' });
  await expect(viewer).toBeVisible();
  await page.keyboard.press('ArrowLeft');
  await expect(viewer.locator('img')).toHaveAttribute('src', new RegExp(project.screenshots[0].src + '$'));
  await page.keyboard.press('Escape');
  await expect(viewer).not.toBeVisible();
  await expect(opener).toBeFocused();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
});
