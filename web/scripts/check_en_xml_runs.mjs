import fs from 'node:fs/promises';
import { JSDOM } from 'jsdom';
import JSZip from 'jszip';

const dom = new JSDOM();
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

async function checkXmlRuns() {
  const f = '算法训练材料/PU-202A/PU-202A msds_EN Guanzhi.docx';
  const buf = await fs.readFile(f);
  const zip = await JSZip.loadAsync(buf);
  const xml = await zip.file('word/document.xml').async('text');
  const doc = new DOMParser().parseFromString(xml, 'application/xml');
  const s11 = doc.getElementsByTagName('w:tbl')[10];
  const trs = s11.getElementsByTagName('w:tr');
  for (let i = 3; i <= 6; i++) {
    const tr = trs[i];
    const tc = tr.getElementsByTagName('w:tc')[0];
    const runs = tc.getElementsByTagName('w:r');
    console.log(`\nRow ${i} Cell 0 xml:`);
    for (const r of Array.from(runs)) {
      const t = r.getElementsByTagName('w:t')[0]?.textContent;
      const b = r.getElementsByTagName('w:b').length > 0;
      console.log(`   <w:r> (b=${b}): "${t}"`);
    }
  }
}
checkXmlRuns();
