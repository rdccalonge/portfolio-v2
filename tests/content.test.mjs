import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { publicContent, validateContent, normalizeContent, readPortfolio } from '../scripts/content.mjs';
const seed = JSON.parse(readFileSync(new URL('./fixtures/portfolio.json', import.meta.url)));
const copy = () => structuredClone(seed);
test('current CMS document and layer collection validate independently of fixtures', () => { publicContent(readPortfolio()); });
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
test('new CMS layer supports projects, skills, description, icon, and order', () => {
  const data = normalizeContent(copy()); data.layers.push({ name: 'Mobile', description: 'Applications on the go.', icon: '📱', order: 9 });
  data.projects[0].layers.push('Mobile'); data.skills.push({ name: 'PowerApps', layer: 'Mobile' });
  const view = publicContent(data); assert(view.projects[0].layers.includes('Mobile')); assert.equal(view.skills.at(-1).layer, 'Mobile');
  assert(view.layers.some(layer => layer.name === 'Mobile' && layer.icon === '📱'));
});
test('duplicate layers and deleting a referenced layer block deployment', () => {
  const data = normalizeContent(copy()); data.layers.push({ name: 'frontend', description: '', icon: '', order: 1 }); assert.throws(() => publicContent(data), /unique/);
  data.layers.pop(); data.layers = data.layers.filter(layer => layer.name !== 'Frontend'); assert.throws(() => publicContent(data), /Unknown layers/);
});
test('an unassigned custom layer can be added with blank optional fields', () => {
  const data = normalizeContent(copy()); data.layers.push({ name: 'AI', description: null, icon: null, order: null });
  const layer = publicContent(data).layers.find(layer => layer.name === 'AI'); assert.equal(layer.icon, '◇'); assert.equal(layer.order, 0);
});
test('certification defaults, publication, and section selection are validated', () => {
  const data = copy(); data.certifications = [{ name: 'Draft certification' }, { name: 'Azure Fundamentals', issuer: 'Microsoft', published: true }];
  data.cv.sections.push('certifications'); const view = publicContent(data);
  assert.equal(view.certifications.length, 1); assert.equal(view.certifications[0].url, ''); assert(view.cv.sections.includes('certifications'));
  data.certifications[1].url = 'javascript:alert(1)'; assert.throws(() => publicContent(data));
});

test('optional project year validates four digits', () => { const data = copy(); data.projects[0].year = '2024'; assert.equal(publicContent(data).projects[0].year, '2024'); data.projects[0].year = ''; publicContent(data); delete data.projects[0].year; publicContent(data); data.projects[0].year = '24'; assert.throws(() => publicContent(data)); });
test('project demo links only allow HTTPS', () => {
  const data = copy(); data.projects[0].links = [{ label: 'Demo', url: 'https://example.com/demo' }];
  assert.equal(publicContent(data).projects[0].links[0].label, 'Demo');
  data.projects[0].links[0].url = 'javascript:alert(1)'; assert.throws(() => publicContent(data));
});
