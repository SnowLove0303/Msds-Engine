import fs from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { JSDOM } = require('./web/node_modules/jsdom');
const JSZip = require('./web/node_modules/jszip');
const dom = new JSDOM();
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

import { loadDocx } from './web/src/docx-engine.js';

const pEn = 'E:/冠志/TDS MSDS (2)/待处理文件/PU-2346A/PU-2346A msds_EN Guanzhi.docx';
const pCn = 'E:/冠志/TDS MSDS (2)/待处理文件/PU-2346A/PU-2346A msds_CN 冠志.docx';

async function checkDoc(p, lang) {
  console.log(`\n=================== ${lang} (${p}) ===================`);
  const buf = fs.readFileSync(p);
  const zip = await JSZip.loadAsync(buf);
  const xml = await zip.file('word/document.xml').async('text');
  const doc = new DOMParser().parseFromString(xml, 'text/xml');
  const tbls = Array.from(doc.getElementsByTagName('w:tbl'));

  // Section 2
  const s2Tbl = tbls[1];
  console.log('--- Section 2 Table Borders & Rows ---');
  const s2TblBorders = s2Tbl.getElementsByTagName('w:tblBorders')[0];
  console.log('tblBorders:', s2TblBorders ? new XMLSerializer().serializeToString(s2TblBorders) : 'none');
  const s2Rows = Array.from(s2Tbl.getElementsByTagName('w:tr'));
  console.log('s2 rows count:', s2Rows.length);
  s2Rows.forEach((r, idx) => {
    const tcBorders = Array.from(r.getElementsByTagName('w:tcBorders')).map(b => new XMLSerializer().serializeToString(b));
    const cantSplit = r.getElementsByTagName('w:cantSplit').length > 0;
    const text = r.textContent.replace(/\s+/g, ' ').slice(0, 80);
    console.log(`Row ${idx}: cantSplit=${cantSplit}, tcBorders=${tcBorders.length}, text: ${text}`);
    if (tcBorders.length > 0) {
      console.log(`   tcBorders xml: ${tcBorders.join('; ')}`);
    }
  });

  // Section 8
  const s8Tbl = tbls[7];
  console.log('\n--- Section 8 Table Details ---');
  const s8Rows = Array.from(s8Tbl.getElementsByTagName('w:tr'));
  console.log('s8 rows count:', s8Rows.length);
  s8Rows.forEach((r, idx) => {
    const cells = Array.from(r.getElementsByTagName('w:tc'));
    console.log(`Row ${idx} (cells: ${cells.length}):`);
    cells.forEach((c, cIdx) => {
      const ps = Array.from(c.getElementsByTagName('w:p'));
      ps.forEach((p, pIdx) => {
        const ind = p.getElementsByTagName('w:ind')[0];
        const indStr = ind ? new XMLSerializer().serializeToString(ind) : 'no ind';
        const runs = Array.from(p.getElementsByTagName('w:r'));
        const runInfos = runs.map(run => {
          const sz = run.getElementsByTagName('w:sz')[0]?.getAttribute('w:val') || 'no sz';
          const rFonts = run.getElementsByTagName('w:rFonts')[0];
          const fontStr = rFonts ? `${rFonts.getAttribute('w:ascii') || ''}/${rFonts.getAttribute('w:eastAsia') || ''}` : 'no font';
          const b = run.getElementsByTagName('w:b').length > 0;
          return `[${run.textContent.slice(0, 15)} | sz=${sz} | font=${fontStr} | b=${b}]`;
        });
        console.log(`   Cell ${cIdx} P ${pIdx} (${indStr}): ${runInfos.join(', ')}`);
      });
    });
  });
}

await checkDoc(pEn, 'EN');
await checkDoc(pCn, 'CN');
