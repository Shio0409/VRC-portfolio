import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { avatarPublicFiles } from './avatar-public-files.mjs';

const project = fileURLToPath(new URL('../', import.meta.url));
const built = process.argv.includes('--dist');
const avatar = !built && process.argv.includes('--avatar');
const root = built ? path.join(project, 'dist') : project;
const portArgument = process.argv.indexOf('--port');
const port = portArgument >= 0 ? Number(process.argv[portArgument + 1]) : 4173;
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.glb': 'model/gltf-binary' };

// Serve only the public web surface. Unity, original documents, and tooling stay private.
const publicFiles = new Map([
  ['/', 'index.html'], ['/index.html', 'index.html'], ['/favicon.svg', 'favicon.svg'],
  ['/src/styles.css', 'src/styles.css'], ['/src/app.js', 'src/app.js'],
  ['/src/viewport.css', 'src/viewport.css'], ['/src/viewport.js', 'src/viewport.js'],
  ['/src/entry-flow.js', 'src/entry-flow.js'], ['/src/assets.js', 'src/assets.js'],
  ['/src/top.css', 'src/top.css'], ['/src/top.js', 'src/top.js'], ['/src/skills.js', 'src/skills.js'],
  ['/src/portal.js', 'src/portal.js'],
  ['/src/top-parallax.js', 'src/top-parallax.js'],
  ['/src/top-background.js', 'src/top-background.js'],
  ['/src/dialogue.js', 'src/dialogue.js'], ['/assets/top-world.webp', 'assets/top-world.webp'],
  ['/assets/playing.png', 'assets/playing.png'],
  ['/assets/cursor-normal.svg', 'assets/cursor-normal.svg'],
  ['/assets/cursor-hover.svg', 'assets/cursor-hover.svg'],
]);

publicFiles.set('/src/career.css', 'src/career.css');
publicFiles.set('/src/career.js', 'src/career.js');
publicFiles.set('/src/career-data.js', 'src/career-data.js');
publicFiles.set('/src/career-clock.js', 'src/career-clock.js');

// Explicit local inspection routes; never included in production or normal preview.
for (const file of avatarPublicFiles) publicFiles.set(`/${file}`, file);
if (avatar) {
  for (const name of ['viewer.html', 'viewer.css', 'viewer.js']) {
    publicFiles.set(`/avatar/${name}`, `tools/avatar/${name}`);
  }
  publicFiles.set('/avatar/', 'tools/avatar/viewer.html');
  publicFiles.set('/avatar/catalog.json', '.local/avatar/animation-catalog.json');
  const modelArgument = process.argv.indexOf('--avatar-model');
  const modelName = modelArgument < 0 ? 'kipfel-web-preview-1k.glb' : process.argv[modelArgument + 1];
  if (!modelName || !/^[a-zA-Z0-9_-]+\.glb$/.test(modelName)) throw new Error('Use a GLB filename in web/.local/avatar for --avatar-model');
  publicFiles.set('/avatar/model.glb', `.local/avatar/${modelName}`);
  for (const name of ['build/three.module.js', 'build/three.core.js', 'examples/jsm/loaders/GLTFLoader.js', 'examples/jsm/controls/OrbitControls.js', 'examples/jsm/utils/BufferGeometryUtils.js']) {
    publicFiles.set(`/avatar/vendor/${name}`, `.local/three/package/${name}`);
  }
}

const server = createServer(async (request, response) => {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.writeHead(405, { Allow: 'GET, HEAD' }).end();
    return;
  }
  try {
    const pathname = new URL(request.url, 'http://localhost').pathname;
    const relative = publicFiles.get(pathname);
    if (!relative) { response.writeHead(404).end('Not found'); return; }
    const file = !built && relative === 'assets/playing.png'
      ? path.resolve(project, '../material/playing.png')
      : path.join(root, relative);
    const info = await stat(file);
    if (!info.isFile()) { response.writeHead(404).end('Not found'); return; }
    response.writeHead(200, {
      'Content-Type': types[path.extname(file)] || 'application/octet-stream',
      'Content-Length': info.size,
      'Cache-Control': 'no-cache',
      'X-Content-Type-Options': 'nosniff',
    });
    if (request.method === 'HEAD') { response.end(); return; }
    const stream = createReadStream(file);
    stream.on('error', () => response.destroy());
    response.on('close', () => stream.destroy());
    stream.pipe(response);
  } catch {
    if (!response.headersSent) response.writeHead(404).end('Not found');
    else response.destroy();
  }
});
server.on('error', (error) => { console.error(error.message); process.exitCode = 1; });
server.listen(port, '127.0.0.1', () => console.log(`Local: http://127.0.0.1:${server.address().port}/ (${built ? 'build' : 'development'})`));
