import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
const content = JSON.parse(readFileSync('.local/public-content.json', 'utf8'));
test('static home, portrait, search, motion controls, and CMS link work', async ({ page }) => {
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
  await expect(page.getByRole('link', { name: 'Manage content' })).toHaveAttribute('href', 'https://app.pagescms.org');
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
