import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const app = resolve(root, 'apps/sana-project-demo');
const routes = new Map([
  ['/apps/sana-project-demo', [resolve(app, 'index.html'), 'text/html; charset=utf-8']],
  ['/apps/sana-project-demo/', [resolve(app, 'index.html'), 'text/html; charset=utf-8']],
  ['/apps/sana-project-demo/index.html', [resolve(app, 'index.html'), 'text/html; charset=utf-8']],
  ['/apps/sana-project-demo/styles.css', [resolve(app, 'styles.css'), 'text/css; charset=utf-8']],
  ['/apps/sana-project-demo/app.mjs', [resolve(app, 'app.mjs'), 'text/javascript; charset=utf-8']],
  ['/apps/sana-project-demo/interest-flow.mjs', [resolve(app, 'interest-flow.mjs'), 'text/javascript; charset=utf-8']],
  ['/apps/sana-project-demo/project-dossier.mjs', [resolve(app, 'project-dossier.mjs'), 'text/javascript; charset=utf-8']],
  ['/apps/sana-project-demo/presentation-policy.mjs', [resolve(app, 'presentation-policy.mjs'), 'text/javascript; charset=utf-8']],
  ['/apps/sana-project-demo/project-dossier-v1.json', [resolve(app, 'project-dossier-v1.json'), 'application/json; charset=utf-8']],
  ['/apps/sana-project-demo/project-projection-v1.json', [resolve(app, 'project-projection-v1.json'), 'application/json; charset=utf-8']],
  ['/apps/sana-project-read/reader-v1.mjs', [resolve(root, 'apps/sana-project-read/reader-v1.mjs'), 'text/javascript; charset=utf-8']],
]);
const port = Number(process.env.PORT || 4175);
const server = createServer(async (request, response) => {
  const pathname = new URL(request.url || '/', 'http://127.0.0.1').pathname;
  if (pathname === '/') {
    response.writeHead(302, { location: '/apps/sana-project-demo/', 'cache-control': 'no-store' });
    response.end();
    return;
  }
  const route = routes.get(pathname);
  if (!route || !['GET', 'HEAD'].includes(request.method || '')) {
    response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8', 'x-content-type-options': 'nosniff' });
    response.end('Not found');
    return;
  }
  try {
    const body = await readFile(route[0]);
    response.writeHead(200, {
      'content-type': route[1],
      'cache-control': 'no-store',
      'content-security-policy': "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'",
      'referrer-policy': 'no-referrer',
      'x-content-type-options': 'nosniff',
      'x-frame-options': 'DENY',
    });
    response.end(request.method === 'HEAD' ? undefined : body);
  } catch {
    response.writeHead(500, { 'content-type': 'text/plain; charset=utf-8', 'x-content-type-options': 'nosniff' });
    response.end('Demo asset unavailable');
  }
});
server.listen(port, '127.0.0.1', () => {
  process.stdout.write(`SANA synthetic demo: http://127.0.0.1:${port}/apps/sana-project-demo/\n`);
});
