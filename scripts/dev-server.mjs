// Zero-dependency static file server for local preview and responsive audits.
import { createServer } from 'node:http';
import { createReadStream, statSync } from 'node:fs';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const port = Number(process.env.PORT || 8099);

const types = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.mjs': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.ico': 'image/x-icon',
    '.woff2': 'font/woff2',
    '.txt': 'text/plain; charset=utf-8'
};

createServer((request, response) => {
    const url = decodeURIComponent((request.url || '/').split('?')[0]);
    let target = normalize(join(root, url));
    if (!target.startsWith(root)) {
        response.writeHead(403).end('Forbidden');
        return;
    }
    try {
        if (statSync(target).isDirectory()) target = join(target, 'index.html');
        statSync(target);
    } catch {
        response.writeHead(404, { 'content-type': 'text/plain' }).end('Not found');
        return;
    }
    response.writeHead(200, {
        'content-type': types[extname(target).toLowerCase()] || 'application/octet-stream',
        'cache-control': 'no-store'
    });
    createReadStream(target).pipe(response);
}).listen(port, '127.0.0.1', () => {
    console.log(`Serving ${root} at http://127.0.0.1:${port}/`);
});
