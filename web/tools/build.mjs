import { mkdir, copyFile, readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { avatarPublicFiles } from './avatar-public-files.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = path.join(root, 'dist');
const files = ['index.html', 'favicon.svg', 'src/styles.css', 'src/viewport.css', 'src/app.js', 'src/viewport.js', 'src/entry-flow.js', 'src/assets.js', 'src/top.css', 'src/top.js', 'src/skills.js', 'src/dialogue.js', 'src/top-background.js', 'src/top-parallax.js', 'src/portal.js', 'src/section-navigation.js', 'assets/top-world.webp', 'assets/lounge-world.webp', 'assets/cursor-normal.svg', 'assets/cursor-hover.svg'];
files.push(...avatarPublicFiles, 'src/career.css', 'src/career.js', 'src/career-data.js', 'src/career-clock.js', 'src/contact.css', 'src/sections.css', 'src/contact.js', 'src/contact-data.js');
await mkdir(path.join(output, 'src'), { recursive: true });
await mkdir(path.join(output, 'assets'), { recursive: true });
for (const file of files) { await mkdir(path.dirname(path.join(output, file)), { recursive:true }); await copyFile(path.join(root, file), path.join(output, file)); }
await copyFile(path.resolve(root, '../material/playing.png'), path.join(output, 'assets/playing.png'));

// Relative URLs work both at a custom-domain root and under a GitHub project path.
const html = await readFile(path.join(output, 'index.html'), 'utf8');
for (const match of html.matchAll(/(?:href|src)="(\.\/[^"#]+)"/g)) await stat(path.resolve(output, match[1]));
console.log(`Built web/dist: ${files.length + 1} static files; Three.js is served locally.`);
