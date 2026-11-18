import fs from 'node:fs/promises';
import { JSDOM } from 'jsdom';
import { loadDocx } from './src/docx-engine.js';
const dom = new JSDOM();
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

async function checkTplRows() {
  const tplBuf = await fs.readFile('public/templates/正式模板_MSDS_CN_冠志(1).docx');
  const tpl = await loadDocx(tplBuf, 'tpl');
  const s2 = tpl.records.find(r => r.sectionNumber === 2);
  s2.rows.forEach((r, idx) => {
    const p = r.cells[0]?.node?.querySelector('p');
    const pPr = p?.querySelector('pPr');
    const serializer = new XMLSerializer();
    console.log(`TPL row ${idx}: text="${r.cells[0]?.text}"`);
    console.log(`   pPr: ${pPr ? serializer.serializeToString(pPr) : 'NONE'}`);
  });
}
checkTplRows();
