import fs from 'fs';
import { JSDOM } from 'jsdom';

const dom = new JSDOM();
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

const { loadDocx } = await import('../src/docx-engine.js');
const { runSmartMatching } = await import('../src/smart-matching.js');

async function debugS11Injection() {
  const userSourcePath = "F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/PU-202A/PU-202A msds_CN 冠志.docx";
  const sourceBuffer = fs.readFileSync(userSourcePath);
  const srcEngine = await loadDocx(sourceBuffer);

  const matched = runSmartMatching(srcEngine.records);
  const s11Match = matched.find(m => m.sectionNumber === 11);
  console.log("Matched Section 11 rows count:", s11Match?.matchedRows?.length);
  s11Match?.matchedRows?.forEach(r => {
    console.log(`  key: "${r.key}" -> val: "${(r.value || '').replace(/\n/g, '\\n')}"`);
  });

  const tplCnPath = "F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/public/templates/正式模板_MSDS_CN_冠志(1).docx";
  const tplEngine = await loadDocx(fs.readFileSync(tplCnPath));
  const s11Tpl = tplEngine.records.find(r => r.sectionNumber === 11);
  console.log("\nTemplate S11 rows count:", s11Tpl?.rows?.length);
  s11Tpl?.rows?.forEach((r, idx) => {
    console.log(`  Tpl Row ${idx}: ${r.cells.map(c => `[${c.kind}:${c.text.replace(/\n/g, '\\n')}]`).join(' | ')}`);
  });
}

debugS11Injection().catch(console.error);
