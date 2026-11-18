import '../src/recognition-engine.js';
import { loadDocx } from '../src/docx-engine.js';
import fs from 'fs';

async function test() {
  const p = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料/1-1 单组份水性聚氨酯树脂 PU/PU-1007/PU-1007 msds_CN 冠志.docx';
  const buf = fs.readFileSync(p);
  const eng = await loadDocx(buf, 'PU-1007.docx');
  const r3 = eng.records[7];
  console.log('Record 7 (Sec 3) rows:');
  for (let i = 0; i < r3.rows.length; i++) {
    const row = r3.rows[i];
    console.log(`  Row ${i}:`, row.cells.map(c => c.text).join(' | '));
  }
}

test();
