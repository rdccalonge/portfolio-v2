import Ajv from 'ajv';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
export const schema = JSON.parse(readFileSync(new URL('../content/schema.json', import.meta.url)));
const validateSchema = new Ajv({ allErrors: true }).compile(schema);
export function readPortfolio(root = process.cwd()) {
  const content = JSON.parse(readFileSync(join(root, 'content/portfolio.json'), 'utf8'));
  const files = readdirSync(join(root, 'content/layers')).filter(file => file.endsWith('.json')).sort();
  content.layers = files.map(file => JSON.parse(readFileSync(join(root, 'content/layers', file), 'utf8')));
  return content;
}
// CMS editors omit untouched optional fields. Supply only documented empty defaults.
// Required identity fields still fail validation; never synthesize project titles/slugs.
export function normalizeContent(raw) {
  const data = structuredClone(raw);
  const fill = (value, defaults) => { for (const [key, fallback] of Object.entries(defaults)) if (value[key] == null) value[key] = structuredClone(fallback); return value; };
  fill(data, { projects: [], skills: [], experience: [], education: [], certifications: [], cv: { summary: '', sections: [], projectIds: [] } });
  const mediaPath = value => typeof value === 'string' ? value.replace(/^\/media\//, 'media/') : value;
  if (data.profile) { fill(data.profile, { summary: '', location: '' }); if (!data.profile.photo) delete data.profile.photo; else data.profile.photo = mediaPath(data.profile.photo); }
  data.projects = data.projects.map(project => fill(project, { category: '', description: '', problem: '', contribution: '', decisions: '', outcome: '', technologies: [], screenshots: [], featured: false, published: false, accent: 'cyan' }));
  for (const project of data.projects) for (const shot of project.screenshots) shot.src = mediaPath(shot.src);
  for (const key of ['experience', 'education']) data[key] = data[key].map(entry => fill(entry, { organization: '', start: '', end: '', details: '', published: false }));
  data.certifications = data.certifications.map(cert => fill(cert, { issuer: '', issued: '', url: '', published: false }));
  fill(data.cv, { summary: '', sections: [], projectIds: [] });
  // Legacy/local export documents may predate the new collection.
  if (data.layers == null) data.layers = [...new Set([...data.skills.map(s => s.layer), ...data.projects.flatMap(p => p.layers)])].map((name, order) => ({ name, description: '', icon: '◇', order }));
  data.layers = data.layers.map(layer => fill(layer, { description: '', icon: '◇', order: 0 })).sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
  return data;
}
export function validateContent(data) {
  if (!validateSchema(data)) throw new Error(JSON.stringify(validateSchema.errors));
  const ids = data.projects.map(p => p.id);
  if (new Set(ids).size !== ids.length) throw new Error('Project slugs must be unique.');
  if (data.cv.projectIds.some(id => !ids.includes(id))) throw new Error('CV references an unknown project.');
  if (data.layers) {
    const names = data.layers.map(layer => layer.name);
    if (new Set(names.map(name => name.toLowerCase())).size !== names.length) throw new Error('Layer names must be unique (ignoring case).');
    const used = [...data.skills.map(skill => skill.layer), ...data.projects.flatMap(project => project.layers)];
    const unknown = [...new Set(used.filter(name => !names.includes(name)))];
    if (unknown.length) throw new Error(`Unknown layers: ${unknown.join(', ')}. Create them in the CMS Layers collection or update the assignments before deleting/renaming a layer.`);
  }
  return data;
}
export function publicContent(data) {
  data = normalizeContent(data);
  validateContent(data);
  const projects = data.projects.filter(p => p.published);
  return { ...data, projects, experience: data.experience.filter(e => e.published), education: data.education.filter(e => e.published), certifications: data.certifications.filter(cert => cert.published), cv: { ...data.cv, projectIds: data.cv.projectIds.filter(id => projects.some(p => p.id === id)) } };
}
