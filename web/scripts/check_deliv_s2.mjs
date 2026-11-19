import fs from 'fs';

const dump = JSON.parse(fs.readFileSync('C:/Users/Administrator/.gemini/antigravity/brain/7f4d4b46-78e6-435a-aa29-f0d6ec194caa/scratch/tri_dump_4840_4902.json', 'utf-8'));

console.log('--- Current PA-4902 Deliverable Section 2 paras ---');
let inS2 = false;
for (const p of dump.tOut4902) {
  if (p.includes('2.危险性概述') || p.includes('2.1')) inS2 = true;
  if (p.includes('3. 成分/组成资料') || p.includes('3.1')) inS2 = false;
  if (inS2) console.log(p);
}

console.log('\n--- Current PA-4840 Deliverable Section 2 paras ---');
inS2 = false;
for (const p of dump.tOut4840) {
  if (p.includes('2.危险性概述') || p.includes('2.1')) inS2 = true;
  if (p.includes('3. 成分/组成资料') || p.includes('3.1')) inS2 = false;
  if (inS2) console.log(p);
}
