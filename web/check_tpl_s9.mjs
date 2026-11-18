import fs from 'node:fs/promises';
import { JSDOM } from 'jsdom';
import { loadDocx } from './src/docx-engine.js';
const dom = new JSDOM();
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

async function checkS9(filePath, title) {
  console.log(`\n================== ${title} ==================`);
  const tplBuf = await fs.readFile(filePath);
  const tpl = await loadDocx(tplBuf, 'tpl');
  const s9 = tpl.records.find(r => r.sectionNumber === 9);
  if (!s9) {
    console.log('Section 9 not found!');
    return;
  }
  const serializer = new XMLSerializer();
  s9.rows.forEach((r, idx) => {
    const c0 = r.cells[0];
    if (!c0) return;
    const p = c0.node?.querySelector('p');
    const pPr = p?.querySelector('pPr');
    const runs = Array.from(c0.node?.querySelectorAll('r') || []);
    console.log(`\n--- Row ${idx} Label: "${c0.text.replace(/\s+/g, ' ').trim()}" ---`);
    console.log(`  pPr: ${pPr ? serializer.serializeToString(pPr) : 'NONE'}`);
    runs.forEach((run, ri) => {
      const rPr = run.querySelector('rPr');
      const t = run.querySelector('t')?.textContent || '';
      console.log(`  Run ${ri}: text="${t}"`);
      console.log(`    rPr: ${rPr ? serializer.serializeToString(rPr) : 'NONE'}`);
    });
  });
}

async function run() {
  await checkS9('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/public/templates/正式模板_MSDS_CN_冠志(1).docx', '中文正式模板 (冠志)');
  await checkS9('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/public/templates/正式模板_MSDS_EN_冠志(1).docx', '英文正式模板 (冠志)');
}
run();
