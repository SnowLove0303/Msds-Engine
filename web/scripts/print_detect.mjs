import fs from 'node:fs';

const content = fs.readFileSync('web/src/pipeline-engine.js', 'utf8');
const match = content.match(/export function detectSection11Paradigm[\s\S]*?^}/m);
console.log(match ? match[0] : 'not found');
