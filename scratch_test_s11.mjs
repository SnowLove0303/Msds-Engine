import fs from 'node:fs/promises';
import { loadDocx } from './web/src/docx-engine.js';

async function test() {
  const buf = await fs.readFile('web/templates/MSDS_EN_Guanzhi.docx');
  const eng = await loadDocx(buf, 'test.docx');
  const s11 = eng.records.find(r => r.sectionNumber === 11);
  console.log('Template EN s11 rows count:', s11.rows.length);
  s11.rows.forEach((r, idx) => {
    console.log('Row', idx, ':', r.cells.map(c => c.text).join(' | '));
  });
}
test();
