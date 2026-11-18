import fs from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const JSZip = require('./web/node_modules/jszip');
const { JSDOM } = require('./web/node_modules/jsdom');
const dom = new JSDOM();
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

const pEn = 'E:/冠志/TDS MSDS (2)/待处理文件/PU-2346A/PU-2346A msds_EN Guanzhi.docx';
const buf = fs.readFileSync(pEn);
const zip = await JSZip.loadAsync(buf);
const xml = await zip.file('word/document.xml').async('text');
const doc = new DOMParser().parseFromString(xml, 'text/xml');
const t2 = doc.getElementsByTagName('w:tbl')[1];
console.log('T2 tblBorders:', new XMLSerializer().serializeToString(t2.getElementsByTagName('w:tblBorders')[0]));
const trs = Array.from(t2.getElementsByTagName('w:tr'));
trs.forEach((tr, i) => {
  const tcs = Array.from(tr.getElementsByTagName('w:tc'));
  console.log(`Row ${i} (cells: ${tcs.length}): text = ${tr.textContent.slice(0, 40).replace(/\s+/g, ' ')}`);
  tcs.forEach((tc, ci) => {
    const b = tc.getElementsByTagName('w:tcBorders')[0];
    if (b) console.log(`   Cell ${ci} tcBorders:`, new XMLSerializer().serializeToString(b));
  });
});
