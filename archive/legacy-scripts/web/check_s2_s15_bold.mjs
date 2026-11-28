import fs from 'fs';
import path from 'path';
import { loadDocx } from './src/docx-engine.js';
import { JSDOM } from 'jsdom';
const dom = new JSDOM();
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

async function check(docPath, label) {
  if (!fs.existsSync(docPath)) {
    console.log(`[Missing] ${docPath}`);
    return;
  }
  const eng = await loadDocx(fs.readFileSync(docPath));
  console.log(`=== ${label} ===`);
  const s2 = eng.records.find(r => r.sectionNumber === 2);
  console.log('--- Section 2 ---');
  if (s2) {
    s2.rows.forEach((r, rIdx) => {
      r.cells.forEach((c, cIdx) => {
        const ps = c.paragraphs || [];
        ps.forEach((p, pIdx) => {
          const txt = p.runs.map(run => run.text).join('');
          const hasB = p.runs.some(run => run.node?.getElementsByTagName('w:b')?.length > 0 || run.node?.getElementsByTagNameNS('*', 'b')?.length > 0) ||
                      p.node?.getElementsByTagName('w:b')?.length > 0 || p.node?.getElementsByTagNameNS('*', 'b')?.length > 0;
          console.log(`  Row ${rIdx} C${cIdx} P${pIdx} [bold=${hasB}]: ${txt}`);
        });
      });
    });
  }
  const s11 = eng.records.find(r => r.sectionNumber === 11);
  console.log('--- Section 11 ---');
  if (s11) {
    s11.rows.forEach((r, rIdx) => {
      r.cells.forEach((c, cIdx) => {
        const ps = c.paragraphs || [];
        ps.forEach((p, pIdx) => {
          const txt = p.runs.map(run => run.text).join('');
          const hasB = p.runs.some(run => run.node?.getElementsByTagName('w:b')?.length > 0 || run.node?.getElementsByTagNameNS('*', 'b')?.length > 0) ||
                      p.node?.getElementsByTagName('w:b')?.length > 0 || p.node?.getElementsByTagNameNS('*', 'b')?.length > 0;
          console.log(`  Row ${rIdx} C${cIdx} P${pIdx} [bold=${hasB}]: ${txt.slice(0, 60)}`);
        });
      });
    });
  }
  const s15 = eng.records.find(r => r.sectionNumber === 15);
  console.log('--- Section 15 ---');
  if (s15) {
    s15.rows.forEach((r, rIdx) => {
      r.cells.forEach((c, cIdx) => {
        const ps = c.paragraphs || [];
        ps.forEach((p, pIdx) => {
          const txt = p.runs.map(run => run.text).join('');
          const hasB = p.runs.some(run => run.node?.getElementsByTagName('w:b')?.length > 0 || run.node?.getElementsByTagNameNS('*', 'b')?.length > 0) ||
                      p.node?.getElementsByTagName('w:b')?.length > 0 || p.node?.getElementsByTagNameNS('*', 'b')?.length > 0;
          console.log(`  Row ${rIdx} C${cIdx} P${pIdx} [bold=${hasB}]: ${txt}`);
        });
      });
    });
  }
}

await check('算法训练材料/TDS MSDS 重写版/04-1 水性环氧树脂 EP/EP-1736/EP-1736 msds_CN 冠志.docx', 'EP-1736 CN');
await check('算法训练材料/TDS MSDS 重写版/04-1 水性环氧树脂 EP/EP-1736/EP-1736 msds_EN Guanzhi.docx', 'EP-1736 EN');
const ecDir = '算法训练材料/TDS MSDS 重写版/04-2 水性环氧固化剂 EC/EC-1804';
if (fs.existsSync(ecDir)) {
  const files = fs.readdirSync(ecDir);
  const cnGz = files.find(f => f.includes('msds_CN') && f.includes('冠志') && f.endsWith('.docx'));
  const enGz = files.find(f => f.includes('msds_EN') && f.includes('Guanzhi') && f.endsWith('.docx'));
  if (cnGz) await check(path.join(ecDir, cnGz), 'EC-1804 CN');
  if (enGz) await check(path.join(ecDir, enGz), 'EC-1804 EN');
}
