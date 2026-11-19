import fs from 'fs';

const dump = JSON.parse(fs.readFileSync('C:/Users/Administrator/.gemini/antigravity/brain/7f4d4b46-78e6-435a-aa29-f0d6ec194caa/scratch/tri_dump_4840_4902.json', 'utf-8'));

console.log('4840 physicalProperties:', JSON.stringify(dump.rec4840.physicalProperties, null, 2));
console.log('4902 physicalProperties:', JSON.stringify(dump.rec4902.physicalProperties, null, 2));
