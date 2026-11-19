import fs from 'fs';

const raw = fs.readFileSync('C:/Users/Administrator/.gemini/antigravity/brain/7f4d4b46-78e6-435a-aa29-f0d6ec194caa/scratch/PA-4902_raw_source_content.txt', 'utf8');
const facts = JSON.parse(fs.readFileSync('C:/Users/Administrator/.gemini/antigravity/brain/7f4d4b46-78e6-435a-aa29-f0d6ec194caa/scratch/PA-4902_recognition_facts.json', 'utf8'));

console.log('=== 全量对比检查 ===');

for (const k of Object.keys(facts)) {
  if (k === 'sections') continue;
  console.log(`\n--- Key: ${k} ---`);
  console.log(JSON.stringify(facts[k], null, 2));
}
