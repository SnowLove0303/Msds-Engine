import fs from 'fs';
import { loadDocx } from './src/docx-engine.js';
import { JSDOM } from 'jsdom';
const dom = new JSDOM();
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

async function checkTemplate(docPath, label) {
  const eng = await loadDocx(fs.readFileSync(docPath));
  console.log(`=== ${label} ===`);
  const s2 = eng.records.find(r => r.sectionNumber === 2);
  console.log('--- Section 2 ---');
  if (s2) {
    s2.rows.forEach((r, rIdx) => {
      r.cells.forEach((c, cIdx) => {
        (c.paragraphs || []).forEach((p, pIdx) => {
          const txt = p.runs.map(run => run.text).join('');
          const hasB = p.runs.some(run => run.node?.getElementsByTagName('w:b')?.length > 0) ||
                      p.node?.getElementsByTagName('w:b')?.length > 0;
          console.log(`  R${rIdx} C${cIdx} P${pIdx} [bold=${hasB}]: ${txt}`);
        });
      });
    });
  }
  const s15 = eng.records.find(r => r.sectionNumber === 15);
  console.log('--- Section 15 ---');
  if (s15) {
    s15.rows.forEach((r, rIdx) => {
      r.cells.forEach((c, cIdx) => {
        (c.paragraphs || []).forEach((p, pIdx) => {
          const txt = p.runs.map(run => run.text).join('');
          const hasB = p.runs.some(run => run.node?.getElementsByTagName('w:b')?.length > 0) ||
                      p.node?.getElementsByTagName('w:b')?.length > 0;
          console.log(`  R${rIdx} C${cIdx} P${pIdx} [bold=${hasB}]: ${txt}`);
        });
      });
    });
  }
}

await checkTemplate('web/public/templates/正式模板_MSDS_CN_冠志(1).docx', 'Official Template CN');
await checkTemplate('web/public/templates/正式模板_MSDS_EN_冠志(1).docx', 'Official Template EN');
