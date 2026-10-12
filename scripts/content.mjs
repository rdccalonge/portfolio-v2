import Ajv from 'ajv';
import { readFileSync } from 'node:fs';
export const schema = JSON.parse(readFileSync(new URL('../content/schema.json', import.meta.url)));
const validateSchema = new Ajv({ allErrors: true }).compile(schema);
// CMS editors omit untouched optional fields. Supply only documented empty defaults.
// Required identity fields still fail validation; never synthesize project titles/slugs.
export function normalizeContent(raw) {
  const data = structuredClone(raw);
  const fill = (value, defaults) => { for (const [key, fallback] of Object.entries(defaults)) if (value[key] == null) value[key] = structuredClone(fallback); return value; };
  fill(data, { projects: [], skills: [], experience: [], education: [], cv: { summary: '', sections: [], projectIds: [] } });
  const mediaPath = value => typeof value === 'string' ? value.replace(/^\/media\//, 'media/') : value;
  if (data.profile) { fill(data.profile, { summary: '', location: '' }); if (!data.profile.photo) delete data.profile.photo; else data.profile.photo = mediaPath(data.profile.photo); }
  data.projects = data.projects.map(project => fill(project, { category: '', description: '', problem: '', contribution: '', decisions: '', outcome: '', technologies: [], screenshots: [], featured: false, published: false, accent: 'cyan' }));
  for (const project of data.projects) for (const shot of project.screenshots) shot.src = mediaPath(shot.src);
  for (const key of ['experience', 'education']) data[key] = data[key].map(entry => fill(entry, { organization: '', start: '', end: '', details: '', published: false }));
  fill(data.cv, { summary: '', sections: [], projectIds: [] });
  return data;
}
export function validateContent(data) {
  if (!validateSchema(data)) throw new Error(JSON.stringify(validateSchema.errors));
  const ids = data.projects.map(p => p.id);
  if (new Set(ids).size !== ids.length) throw new Error('Project slugs must be unique.');
  if (data.cv.projectIds.some(id => !ids.includes(id))) throw new Error('CV references an unknown project.');
  return data;
}
export function publicContent(data) {
  data = normalizeContent(data);
  validateContent(data);
  const projects = data.projects.filter(p => p.published);
  return { ...data, projects, experience: data.experience.filter(e => e.published), education: data.education.filter(e => e.published), cv: { ...data.cv, projectIds: data.cv.projectIds.filter(id => projects.some(p => p.id === id)) } };
}
