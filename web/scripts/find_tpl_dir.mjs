import fs from 'node:fs';

const content = fs.readFileSync('web/src/pipeline-engine.js', 'utf8');
const match = content.match(/TEMPLATES_DIR\s*=\s*([^;\n]+)/);
console.log(match ? match[0] : 'not found');
