import { readFile, writeFile, mkdir, readdir, cp, rm, stat } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { compile } from 'json-schema-to-typescript';
import { publicContent, schema, readPortfolio } from './content.mjs';
const data = publicContent(readPortfolio());
await mkdir('.local', { recursive: true });
await writeFile('.local/public-content.json', JSON.stringify(data, null, 2));
const assets = resolve('.local/site-assets');
if (assets !== resolve(process.cwd(), '.local', 'site-assets')) throw new Error('Unexpected assets directory.');
await rm(assets, { recursive: true, force: true });
await mkdir(assets, { recursive: true });
await cp('public/favicon.svg', `${assets}/favicon.svg`);
const media = new Set([data.profile.photo, ...data.projects.flatMap(p => p.screenshots.map(s => s.src))].filter(Boolean));
for (const path of media) {
  const source = resolve('public', path);
  if (!(await stat(source)).isFile()) throw new Error(`Missing selected media: ${path}`);
  await mkdir(dirname(`${assets}/${path}`), { recursive: true }); await cp(source, `${assets}/${path}`);
}
await mkdir('src/generated', { recursive: true });
await writeFile('src/generated/model.ts', await compile(schema, 'Portfolio', { bannerComment: '/* Generated from content/schema.json. Do not edit. */' }));
await writeFile('src/generated/content.ts', `import type { Portfolio } from './model';\nexport const CONTENT: Portfolio = ${JSON.stringify(data, null, 2)};\n`);
await mkdir('public/downloads', { recursive: true });
const available = (await readdir('public/downloads')).filter(f => ['reni-calonge-cv.pdf', 'reni-calonge-cv.docx'].includes(f));
await mkdir(`${assets}/downloads`, { recursive: true });
for (const file of available) await cp(`public/downloads/${file}`, `${assets}/downloads/${file}`);
await writeFile('src/generated/downloads.ts', `export const DOWNLOADS: string[] = ${JSON.stringify(available)};\n`);
console.log(`Validated ${data.projects.length} published projects; generated shared types and public content.`);
