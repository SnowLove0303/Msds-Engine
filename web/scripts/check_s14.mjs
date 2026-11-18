import fs from 'node:fs';

const dump = JSON.parse(fs.readFileSync('C:/Users/Administrator/.gemini/antigravity/brain/7f4d4b46-78e6-435a-aa29-f0d6ec194caa/scratch/bl8126_source_dump.json', 'utf8'));

console.log('Source Table 14:');
console.log(JSON.stringify(dump.tables[13], null, 2));
