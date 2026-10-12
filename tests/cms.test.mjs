import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parse } from 'yaml';
import { schema } from '../scripts/content.mjs';
const config = parse(readFileSync(new URL('../.pages.yml', import.meta.url), 'utf8'));
const fields = config.content[0].fields;
const field = name => fields.find(f => f.name === name);
test('CMS single-file editor matches the canonical content contract', () => {
  assert.equal(config.content[0].path, 'content/portfolio.json'); assert.equal(config.content[0].format, 'json');
  assert.deepEqual(fields.map(f => f.name).sort(), Object.keys(schema.properties).filter(name => name !== 'layers').sort());
  assert.deepEqual(field('profile').fields.map(f => f.name).sort(), Object.keys(schema.properties.profile.properties).sort());
  assert.deepEqual(field('projects').fields.map(f => f.name).sort(), Object.keys(schema.definitions.Project.properties).sort());
  assert.deepEqual(config.components['career-entry'].fields.map(f => f.name).sort(), Object.keys(schema.definitions.Entry.properties).sort());
});
test('CMS media, layer choices, and CV options match build validation', () => {
  assert.equal(config.media.input, 'public/media'); assert.equal(config.media.output, '/media'); assert.equal(config.media.rename, 'random');
  const layers = config.content.find(entry => entry.name === 'layers');
  assert.equal(layers.type, 'collection'); assert.equal(layers.path, 'content/layers'); assert.equal(layers.view.primary, 'name');
  assert.deepEqual(layers.fields.map(f => f.name).sort(), Object.keys(schema.definitions.LayerDefinition.properties).sort());
  for (const reference of [field('projects').fields.find(f => f.name === 'layers'), field('skills').fields.find(f => f.name === 'layer')]) {
    assert.equal(reference.type, 'reference'); assert.equal(reference.options.collection, 'layers');
    // CMS reserves bare "name" for filenames; explicit fields.name avoids an empty primary value.
    assert.equal(reference.options.search, 'fields.name'); assert.equal(reference.options.value, '{fields.name}'); assert.equal(reference.options.label, '{fields.name}');
  }
  assert.deepEqual(field('cv').fields.find(f => f.name === 'sections').options.values, schema.properties.cv.properties.sections.items.enum);
  assert(field('cv').fields.find(f => f.name === 'sections').list);
});
test('deployment workflow generates CVs and deploys only static files', () => {
  const workflow = parse(readFileSync(new URL('../.github/workflows/pages.yml', import.meta.url), 'utf8'));
  assert.deepEqual(workflow.on.push.branches, ['main']); assert(workflow.jobs.deploy.if.includes("!= 'pull_request'"));
  assert.equal(workflow.jobs.build.steps.find(step => step.uses?.startsWith('actions/upload-pages-artifact')).with.path, 'dist/public/browser');
  const commands = workflow.jobs.build.steps.filter(step => step.run).map(step => step.run);
  assert(commands.findIndex(c => c.includes('--export-public')) < commands.indexOf('npm run build'));
  assert(commands.includes('npm run test:e2e'));
});
