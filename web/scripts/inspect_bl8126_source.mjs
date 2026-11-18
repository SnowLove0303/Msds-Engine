import fs from 'node:fs';

const data = JSON.parse(fs.readFileSync('C:/Users/Administrator/.gemini/antigravity/brain/7f4d4b46-78e6-435a-aa29-f0d6ec194caa/scratch/bl8126_source_dump.json', 'utf8'));

console.log('=== TABLE SUMMARIES ===');
data.tables.forEach((tbl, idx) => {
  console.log(`\nTable ${idx + 1} (Rows: ${tbl.length}):`);
  tbl.forEach((row, rIdx) => {
    console.log(`  R${rIdx}: ${JSON.stringify(row)}`);
  });
});

console.log('\n=== PARAGRAPHS PREVIEW (Non-table) ===');
data.paragraphs.slice(0, 30).forEach((p, idx) => {
  console.log(`P${idx}: ${p}`);
});
