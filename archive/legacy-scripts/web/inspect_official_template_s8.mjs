import fs from 'fs';
import path from 'path';
import { JSDOM } from 'jsdom';
const dom = new JSDOM();
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

import { loadDocx } from './src/docx-engine.js';

const TEMPLATES_DIR = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/public/templates';
const tplDocx = path.join(TEMPLATES_DIR, '正式模板_MSDS_CN_冠志(1).docx');
const eng = await loadDocx(fs.readFileSync(tplDocx));
const s8 = eng.records.find(r => r.sectionNumber === 8);
console.log('--- Official CN Template Section 8 Rows ---');
s8.rows.forEach((r, idx) => {
  const c0 = r.cells[0]?.text || '';
  const c1 = r.cells[1]?.text || '';
  const c2 = r.cells[2]?.text || '';
  const c3 = r.cells[3]?.text || '';
  console.log(`Row ${idx + 1} (${r.cells.length} cells): [${c0}] | [${c1}] ${c2 ? '| [' + c2 + ']' : ''} ${c3 ? '| [' + c3 + ']' : ''}`);
});

const enTplDocx = path.join(TEMPLATES_DIR, '正式模板_MSDS_EN_冠志(1).docx');
const enEng = await loadDocx(fs.readFileSync(enTplDocx));
const enS8 = enEng.records.find(r => r.sectionNumber === 8);
console.log('\n--- Official EN Template Section 8 Rows ---');
enS8.rows.forEach((r, idx) => {
  const c0 = r.cells[0]?.text || '';
  const c1 = r.cells[1]?.text || '';
  const c2 = r.cells[2]?.text || '';
  const c3 = r.cells[3]?.text || '';
  console.log(`Row ${idx + 1} (${r.cells.length} cells): [${c0}] | [${c1}] ${c2 ? '| [' + c2 + ']' : ''} ${c3 ? '| [' + c3 + ']' : ''}`);
});
