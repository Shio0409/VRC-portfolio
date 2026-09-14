import { mkdir, copyFile, readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = path.join(root, 'dist');
const files = ['index.html', 'favicon.svg', 'src/styles.css', 'src/viewport.css', 'src/app.js', 'src/viewport.js', 'src/entry-flow.js', 'src/assets.js', 'src/top.css', 'src/top.js', 'src/skills.js', 'assets/cursor-normal.svg', 'assets/cursor-hover.svg'];
await mkdir(path.join(output, 'src'), { recursive: true });
await mkdir(path.join(output, 'assets'), { recursive: true });
for (const file of files) await copyFile(path.join(root, file), path.join(output, file));
await copyFile(path.resolve(root, '../material/playing.png'), path.join(output, 'assets/playing.png'));

// Relative URLs work both at a custom-domain root and under a GitHub project path.
const html = await readFile(path.join(output, 'index.html'), 'utf8');
for (const match of html.matchAll(/(?:href|src)="(\.\/[^"#]+)"/g)) await stat(path.resolve(output, match[1]));
console.log(`Built web/dist: ${files.length + 1} static files, no runtime dependencies.`);
