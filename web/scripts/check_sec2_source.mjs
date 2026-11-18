import fs from 'node:fs';

const data = JSON.parse(fs.readFileSync('C:/Users/Administrator/.gemini/antigravity/brain/7f4d4b46-78e6-435a-aa29-f0d6ec194caa/scratch/bl8126_source_dump.json', 'utf8'));

console.log('--- Search "信号词" in BL-8126 source ---');
data.paragraphs.forEach((p, i) => {
  if (p.includes('信号词') || p.includes('象形图')) {
    console.log(`P${i}: ${p}`);
  }
});

data.tables[1].forEach((row, r) => {
  console.log(`Table 2 Row ${r}: ${JSON.stringify(row)}`);
});
