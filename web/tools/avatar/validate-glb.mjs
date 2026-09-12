// Requires the official gltf-validator package (or AVATAR_VALIDATOR_MODULE path).
import { readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
const [input, reportPath] = process.argv.slice(2);
if (!input || !reportPath || path.resolve(input) === path.resolve(reportPath)) throw new Error('Specify GLB input and separate JSON report paths.');
const require = createRequire(import.meta.url);
const validator = require(process.env.AVATAR_VALIDATOR_MODULE || 'gltf-validator');
const bytes = await readFile(input);
const report = await validator.validateBytes(new Uint8Array(bytes), { uri: path.basename(input), maxIssues: 500 });
await writeFile(reportPath, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ errors: report.issues.numErrors, warnings: report.issues.numWarnings, truncated: report.issues.truncated, info: report.info }, null, 2));
if (report.issues.numErrors || report.issues.truncated) process.exitCode = 1;
