import fs from 'node:fs';

const content = fs.readFileSync('C:/Users/Administrator/.gemini/antigravity/brain/7f4d4b46-78e6-435a-aa29-f0d6ec194caa/.system_generated/steps/39042/output.txt', 'utf8');
const lines = content.split('\n');
const fails = lines.filter(l => l.includes('FAIL'));
console.log('FAIL COUNT:', fails.length);
fails.forEach((f, idx) => console.log((idx + 1) + ': ' + f.trim()));
