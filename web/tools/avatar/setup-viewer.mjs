import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const directory = new URL('../../.local/three/', import.meta.url);
const archive = new URL('../../.local/three.tgz', import.meta.url);
const integrity = 'o+qycAMZrh+TsE01GqWUxUIKR1AL0S8pq7zDkYOQw8GqfX8b8VoCKYUoHbhiX5j+7hr8XsuHDVU6+gkQJQKg9w==';
let bytes;
try { bytes = await readFile(archive); }
catch (error) {
  if (error.code !== 'ENOENT') throw error;
  const response = await fetch('https://registry.npmjs.org/three/-/three-0.180.0.tgz');
  if (!response.ok) throw new Error(`Three.js download: HTTP ${response.status}`);
  bytes = Buffer.from(await response.arrayBuffer());
}
if (createHash('sha512').update(bytes).digest('base64') !== integrity) throw new Error('Three.js archive checksum mismatch');
await mkdir(directory, { recursive: true });
await writeFile(archive, bytes);
execFileSync('tar', ['-xzf', fileURLToPath(archive), '-C', fileURLToPath(directory)], { windowsHide: true });
console.log('Three.js 0.180.0 is ready in web/.local/three/package (local inspection only).');
