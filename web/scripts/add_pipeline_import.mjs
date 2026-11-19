import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const targetPath = path.resolve(__dirname, '../src/pipeline-engine.js');
const proposedPath = path.resolve(__dirname, '../data/proposed_pipeline-engine.js');

let content = fs.readFileSync(targetPath, 'utf8');

if (!content.includes("import { getBenchmarkSpecsByCategory } from './msds-db.js';")) {
  content = `import { getBenchmarkSpecsByCategory } from './msds-db.js';\n` + content;
}

fs.writeFileSync(proposedPath, content, 'utf8');
console.log('Line 1 import added to proposed_pipeline-engine.js.');
