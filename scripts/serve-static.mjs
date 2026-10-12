import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
const root = resolve('dist/public/browser');
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.pdf': 'application/pdf', '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' };
createServer(async (request, response) => {
  try {
    const url = new URL(request.url, 'http://127.0.0.1:4300'); const path = decodeURIComponent(url.pathname);
    if (!path.startsWith('/portfolio-v2/')) { response.writeHead(404); response.end(); return; }
    let file = resolve(root, path.slice('/portfolio-v2/'.length));
    if (file !== root && !file.startsWith(root + sep)) { response.writeHead(403); response.end(); return; }
    if ((await stat(file)).isDirectory()) file = resolve(file, 'index.html');
    response.writeHead(200, { 'Content-Type': mime[extname(file)] || 'application/octet-stream' }); response.end(await readFile(file));
  } catch { response.writeHead(404); response.end('Not found'); }
}).listen(4300, '127.0.0.1', () => console.log('Static test server: http://127.0.0.1:4300/portfolio-v2/'));
