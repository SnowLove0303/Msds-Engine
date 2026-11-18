import fs from 'node:fs/promises';
import { loadDocx } from '../src/docx-engine.js';
import { JSDOM } from 'jsdom';

const dom = new JSDOM();
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

async function checkTemplateS9() {
  const p = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/public/templates/正式模板_MSDS_CN_冠志(1).docx';
  const buf = await fs.readFile(p);
  const engine = await loadDocx(buf, 'tpl.docx');
  const s9 = engine.records.find(r => r.sectionNumber === 9);
  console.log('=== Official CN Template Section 9 ===');
  if (s9) {
    for (const r of s9.rows) {
      console.log(r.cells[0]?.text?.trim(), '-->', r.cells[1]?.text?.trim());
    }
  }
}

checkTemplateS9().catch(console.error);
