import fs from 'fs';

const src = JSON.parse(fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/scratch/src_elements.json', 'utf8'));
const outCn = JSON.parse(fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/scratch/out_cn_elements.json', 'utf8'));

console.log('=== SOURCE ALL TABLES ===');
let sTblIdx = 0;
for (const e of src) {
  if (e.type === 'tbl') {
    const title = e.rows[0]?.[0] || 'NO TITLE';
    console.log(`Table ${sTblIdx++}: rows=${e.rows.length}, title="${title}"`);
    for (let i = 0; i < Math.min(e.rows.length, 5); i++) {
      console.log(`    r${i}: ${JSON.stringify(e.rows[i])}`);
    }
  } else {
    console.log(`Paragraph: "${e.text}"`);
  }
}

console.log('\n=== OUT CN ALL TABLES ===');
let oTblIdx = 0;
for (const e of outCn) {
  if (e.type === 'tbl') {
    const title = e.rows[0]?.[0] || 'NO TITLE';
    console.log(`Table ${oTblIdx++}: rows=${e.rows.length}, title="${title}"`);
    for (let i = 0; i < Math.min(e.rows.length, 5); i++) {
      console.log(`    r${i}: ${JSON.stringify(e.rows[i])}`);
    }
  } else {
    console.log(`Paragraph: "${e.text}"`);
  }
}
