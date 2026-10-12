import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { publicContent, validateContent, normalizeContent } from '../scripts/content.mjs';
const seed = JSON.parse(readFileSync(new URL('./fixtures/portfolio.json', import.meta.url)));
const copy = () => structuredClone(seed);
test('current CMS document normalizes and validates independently of fixtures', () => { publicContent(JSON.parse(readFileSync(new URL('../content/portfolio.json', import.meta.url)))); });
test('canonical content validates and publication preserves all seed projects', () => { validateContent(copy()); assert.equal(publicContent(seed).projects.length, 6); });
test('minimal new CMS project defaults unpublished; no missing template data', () => {
  const data = copy(); data.projects.push({ id: 'new-system', title: 'New system', layers: ['Backend'] });
  const normalized = normalizeContent(data); validateContent(normalized);
  assert.equal(normalized.projects.at(-1).published, false); assert.equal(normalized.projects.at(-1).accent, 'cyan');
  assert.equal(publicContent(data).projects.length, 6);
});
test('publishing a new CMS project includes it without template changes', () => {
  const data = copy(); data.projects.push({ id: 'new-system', title: 'New system', layers: ['Backend'], published: true });
  assert.equal(publicContent(data).projects.at(-1).id, 'new-system');
});
test('unpublished work and CV references are excluded without mutating the source', () => {
  const data = copy(); data.projects[0].published = false; data.experience = [{ title: 'Private draft', published: false }];
  const view = publicContent(data); assert(!view.projects.some(p => p.id === 'data-auto-mapper')); assert(!view.cv.projectIds.includes('data-auto-mapper')); assert.equal(view.experience.length, 0); assert.equal(data.projects.length, 6);
});
test('CMS media paths become relative to the GitHub Pages base', () => {
  const data = copy(); data.profile.photo = '/media/portrait.jpg'; data.projects[0].screenshots = [{ src: '/media/demo.png', alt: 'Demo screen' }];
  const view = publicContent(data); assert.equal(view.profile.photo, 'media/portrait.jpg'); assert.equal(view.projects[0].screenshots[0].src, 'media/demo.png');
});
test('duplicate and invalid slugs block deployment', () => {
  const data = copy(); data.projects[1].id = data.projects[0].id; assert.throws(() => publicContent(data), /unique/);
  data.projects[1].id = '../outside'; assert.throws(() => publicContent(data));
});
test('unknown CV project references and duplicate sections block deployment', () => {
  const data = copy(); data.cv.projectIds.push('unknown'); assert.throws(() => publicContent(data), /unknown/);
  data.cv.projectIds.pop(); data.cv.sections.push('summary'); assert.throws(() => publicContent(data));
});
test('required identity fields are not synthesized for empty CMS projects', () => { const data = copy(); data.projects.push({ title: 'No slug', layers: ['Data'] }); assert.throws(() => publicContent(data)); });
test('unsafe media and contact links are rejected', () => {
  const data = copy(); data.profile.photo = 'https://other.example/private.jpg'; assert.throws(() => publicContent(data));
  delete data.profile.photo; data.profile.github = 'javascript:alert(1)'; assert.throws(() => publicContent(data));
});
test('section selection and project order are preserved', () => {
  const data = copy(); data.cv.sections = ['projects', 'summary']; data.cv.projectIds.reverse(); const view = publicContent(data);
  assert.deepEqual(view.cv.sections, data.cv.sections); assert.deepEqual(view.cv.projectIds, data.cv.projectIds);
});
