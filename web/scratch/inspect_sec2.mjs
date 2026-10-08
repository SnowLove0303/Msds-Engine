import fs from 'node:fs/promises';
import JSZip from 'jszip';
import { JSDOM } from 'jsdom';

const buf = await fs.readFile('public/templates/正式模板_MSDS_CN_冠志(1).docx');
const zip = await JSZip.loadAsync(buf);
const xmlStr = await zip.file('word/document.xml').async('text');
const dom = new JSDOM(xmlStr, { contentType: 'application/xml' });
const doc = dom.window.document;
const tables = Array.from(doc.getElementsByTagName('w:tbl'));

for (const t of tables) {
  if (t.textContent.includes('危险性概述')) {
    const trs = Array.from(t.getElementsByTagName('w:tr'));
    console.log('Total trs:', trs.length);
    trs.forEach((tr, i) => {
      const tcs = Array.from(tr.getElementsByTagName('w:tc'));
      console.log(`TR ${i}: ${tcs.length} tc elements`);
      tcs.forEach((tc, j) => {
        const text = tc.textContent.trim().replace(/\s+/g, ' ');
        const vMerge = tc.getElementsByTagName('w:vMerge')[0];
        const vMergeVal = vMerge ? (vMerge.getAttribute('w:val') || 'continue') : 'none';
        const gridSpan = tc.getElementsByTagName('w:gridSpan')[0]?.getAttribute('w:val');
        const tcW = tc.getElementsByTagName('w:tcW')[0]?.getAttribute('w:w');
        console.log(`  TC ${j}: text="${text.slice(0, 40)}" vMerge=${vMergeVal} gridSpan=${gridSpan} w=${tcW}`);
      });
    });
  }
}
