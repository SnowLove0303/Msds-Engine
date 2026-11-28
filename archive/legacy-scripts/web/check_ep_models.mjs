import fs from 'fs';
import { loadDocx } from './src/docx-engine.js';
import { JSDOM } from 'jsdom';
const dom = new JSDOM();
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

const models = ['EP-1736', 'EP-1704', 'EP-1505', 'EP-1501', 'EP-1737'];

for (const m of models) {
  const cnPath = `算法训练材料/TDS MSDS 重写版/04-1 水性环氧树脂 EP/${m}/${m} msds_CN 冠志.docx`;
  if (!fs.existsSync(cnPath)) continue;
  const eng = await loadDocx(fs.readFileSync(cnPath));
  console.log(`\n=================== ${m} CN ===================`);
  const s2 = eng.records.find(r => r.sectionNumber === 2);
  if (s2) {
    console.log('--- Section 2 ---');
    s2.rows.forEach((r, rIdx) => {
      r.cells.forEach((c, cIdx) => {
        (c.paragraphs || []).forEach((p, pIdx) => {
          const txt = p.runs.map(run => run.text).join('');
          const hasB = p.runs.some(run => run.node?.getElementsByTagName('w:b')?.length > 0) ||
                      p.node?.getElementsByTagName('w:b')?.length > 0;
          console.log(`  P${pIdx} [bold=${hasB}]: ${txt}`);
        });
      });
    });
  }
  const s15 = eng.records.find(r => r.sectionNumber === 15);
  if (s15) {
    console.log('--- Section 15 ---');
    s15.rows.forEach((r, rIdx) => {
      const c = r.cells[0];
      const txt = (c?.paragraphs || []).map(p => p.runs.map(run => run.text).join('')).join(' ');
      const hasB = c?.node?.getElementsByTagName('w:b')?.length > 0;
      console.log(`  Row ${rIdx} [bold=${hasB}]: ${txt}`);
    });
  }
}
