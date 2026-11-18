import fs from 'fs';

const out = fs.readFileSync('C:/Users/Administrator/.gemini/antigravity/brain/7f4d4b46-78e6-435a-aa29-f0d6ec194caa/.system_generated/steps/18391/output.txt', 'utf8');
const lines = out.split('\n');
console.log('Total lines:', lines.length);
const idx = lines.findIndex(l => l.includes('SECTION 8 TABLE XML SNIPPETS'));
console.log(lines.slice(idx, idx + 80).join('\n'));
