import { DOMParser, XMLSerializer } from '@xmldom/xmldom';
globalThis.DOMParser = DOMParser;
globalThis.XMLSerializer = XMLSerializer;

import { loadDocx } from '../src/docx-engine.js';
import fs from 'fs/promises';

async function test() {
  const tplPath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/public/templates/正式模板_MSDS_CN_冠志(1).docx';
  const buf = await fs.readFile(tplPath);
  const eng = await loadDocx(buf, 'template.docx');
  const s8 = eng.records.find(r => r.sectionNumber === 8);
  console.log('Section 8 table found:', !!s8);
  if (s8) {
    console.log('Section 8 rows count:', s8.rows.length);
    s8.rows.forEach((r, idx) => {
      console.log(`Row ${idx}: cells=${r.cells.length}, text="${r.cells.map(c => c.text).join(' | ')}"`);
    });
  }
}

test();
