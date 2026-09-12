// Repack embedded PNG textures without modifying meshes, skins, or morph data.
// node tools/avatar/optimize-glb.mjs input.glb output.glb [maxTextureSize]
import { readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import assert from 'node:assert/strict';

const [input, output, limit = '1024'] = process.argv.slice(2);
if (!input || !output || path.resolve(input) === path.resolve(output)) throw new Error('Specify separate input and output GLB paths.');
const maxSize = Number(limit);
if (!Number.isInteger(maxSize) || maxSize < 256 || maxSize > 4096) throw new Error('Texture size must be 256–4096.');
const require = createRequire(import.meta.url);
const sharp = require(process.env.AVATAR_SHARP_MODULE || 'sharp');
const bytes = await readFile(input);
assert.equal(bytes.readUInt32LE(0), 0x46546c67);
assert.equal(bytes.readUInt32LE(4), 2);
assert.equal(bytes.readUInt32LE(8), bytes.length);
assert.equal(bytes.readUInt32LE(16), 0x4e4f534a);
const jsonLength = bytes.readUInt32LE(12);
const doc = JSON.parse(bytes.subarray(20, 20 + jsonLength).toString());
const binStart = 20 + jsonLength;
assert.equal(bytes.readUInt32LE(binStart + 4), 0x004e4942);
assert.equal(doc.buffers.length, 1);
assert.ok(!doc.buffers[0].uri);
const binary = bytes.subarray(binStart + 8, binStart + 8 + bytes.readUInt32LE(binStart));
const replacements = new Map();
const textureReport = [];
for (const image of doc.images || []) {
  assert.equal(image.mimeType, 'image/png', 'This pipeline expects embedded PNG images.');
  const view = doc.bufferViews[image.bufferView];
  assert.equal(view.buffer, 0);
  const original = binary.subarray(view.byteOffset || 0, (view.byteOffset || 0) + view.byteLength);
  if (!replacements.has(image.bufferView)) {
    const result = await sharp(original).resize({ width: maxSize, height: maxSize, fit: 'inside', withoutEnlargement: true }).png({ compressionLevel: 9, adaptiveFiltering: true }).toBuffer({ resolveWithObject: true });
    replacements.set(image.bufferView, result.data);
    textureReport.push({ name: image.name, before: original.length, after: result.data.length, width: result.info.width, height: result.info.height });
  }
}
const chunks = [];
let offset = 0;
for (let index = 0; index < doc.bufferViews.length; index++) {
  const view = doc.bufferViews[index];
  assert.equal(view.buffer, 0);
  const original = binary.subarray(view.byteOffset || 0, (view.byteOffset || 0) + view.byteLength);
  const data = replacements.get(index) || original;
  const padding = (4 - offset % 4) % 4;
  if (padding) chunks.push(Buffer.alloc(padding));
  offset += padding;
  view.byteOffset = offset;
  view.byteLength = data.length;
  chunks.push(data);
  offset += data.length;
}
doc.buffers[0].byteLength = offset;
const binaryPadding = (4 - offset % 4) % 4;
chunks.push(Buffer.alloc(binaryPadding));
const newBinary = Buffer.concat(chunks);
const json = Buffer.from(JSON.stringify(doc));
const jsonPadded = Buffer.concat([json, Buffer.alloc((4 - json.length % 4) % 4, 0x20)]);
const header = Buffer.alloc(20);
header.writeUInt32LE(0x46546c67, 0);
header.writeUInt32LE(2, 4);
header.writeUInt32LE(28 + jsonPadded.length + newBinary.length, 8);
header.writeUInt32LE(jsonPadded.length, 12);
header.writeUInt32LE(0x4e4f534a, 16);
const binHeader = Buffer.alloc(8);
binHeader.writeUInt32LE(newBinary.length, 0);
binHeader.writeUInt32LE(0x004e4942, 4);
await writeFile(output, Buffer.concat([header, jsonPadded, binHeader, newBinary]), { flag: 'wx' });
console.log(JSON.stringify({ inputBytes: bytes.length, outputBytes: header.readUInt32LE(8), textures: textureReport }, null, 2));
