import fs from 'node:fs';
import path from 'node:path';
import { DOMParser, XMLSerializer } from '@xmldom/xmldom';
globalThis.DOMParser = DOMParser;
globalThis.XMLSerializer = XMLSerializer;

import { loadDocx } from '../src/docx-engine.js';

const docxPath = path.resolve('output/test_workflow_decoupling/OS-8970_test_CN_Guanzhi.docx');
const buf = fs.readFileSync(docxPath);
const engine = await loadDocx(buf, path.basename(docxPath));

console.log('--- 检查所有 16 个章节的文本内容 ---');
for (const r of engine.records) {
  const rowCount = r.rows?.length || 0;
  let filledCells = 0;
  for (const row of (r.rows || [])) {
    for (let c = 1; c < row.cells.length; c++) {
      if ((row.cells[c].text || '').trim()) filledCells++;
    }
  }
  console.log(`第 ${r.sectionNumber} 节 (${(r.title || '').trim()}): 总行数=${rowCount}, 填写值单元格数=${filledCells}`);
}
