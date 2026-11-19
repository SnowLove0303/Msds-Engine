import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const targetPath = path.resolve(__dirname, '../src/smart-matching.js');
const proposedPath = path.resolve(__dirname, '../data/proposed_smart-matching.js');

let content = fs.readFileSync(targetPath, 'utf8');

// Insert import at line 10
content = `import { getBenchmarkSpecsByCategory } from './msds-db.js';\n` + content;

fs.writeFileSync(proposedPath, content, 'utf8');
console.log('Proposed smart-matching.js with import written.');
