import { readdir, readFile, stat } from 'node:fs/promises';
const root = 'dist/public/browser';
const content = JSON.parse(await readFile('content/portfolio.json', 'utf8'));
for (const p of content.projects.filter(p => p.published)) await stat(`${root}/projects/${p.id}/index.html`);
async function inspect(path) {
  for (const entry of await readdir(path, { withFileTypes: true })) {
    const full = `${path}/${entry.name}`;
    if (entry.isDirectory()) await inspect(full);
    else {
      if (/draft|schema\.json|admin|\.cs$|\.map$|\.docx$/.test(entry.name) && !full.includes('/downloads/')) throw new Error(`Unexpected private artifact: ${full}`);
      if (/\.(js|html|json)$/.test(entry.name)) {
        const text = await readFile(full, 'utf8');
        if (text.includes('/api/publish') || text.includes('X-Admin-Token') || text.includes('LOCAL_DRAFT_SENTINEL')) throw new Error(`Admin/private code leaked: ${full}`);
      }
    }
  }
}
await inspect(root);
console.log('Public routes and artifact isolation verified.');
