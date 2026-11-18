import fs from 'node:fs';
import JSZip from 'jszip';
import { DOMParser } from '@xmldom/xmldom';

const files = [
  'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/PA-3223/PA-3223 msds_CN 冠志.docx',
  'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/PA-3223/PA-3223 msds_EN Guanzhi.docx'
];

async function scan() {
  for (const f of files) {
    const filename = f.split('/').pop();
    console.log(`\n========================================================================`);
    console.log(`  FILE: ${filename}`);
    console.log(`========================================================================`);
    const zip = await JSZip.loadAsync(fs.readFileSync(f));
    const xml = await zip.file('word/document.xml').async('text');
    const doc = new DOMParser().parseFromString(xml, 'text/xml');
    const tbls = doc.getElementsByTagName('w:tbl');

    for (let t = 0; t < tbls.length; t++) {
      const ps = tbls[t].getElementsByTagName('w:p');
      for (let p = 0; p < ps.length; p++) {
        const text = ps[p].textContent.trim();
        if (!text) continue;

        // Skip table headers and section numbers
        if (/^(?:\d+\.|\d+\.\d+|Section|Product|Chemical)/i.test(text)) continue;

        const lastChar = text.slice(-1);
        const hasEndPunct = /[。；！？.;!?：:]/.test(lastChar);
        if (!hasEndPunct && text.length > 5) {
          console.log(`Section ${t + 1} P${p}: "${text}"`);
        }
      }
    }
  }
}

scan().catch(console.error);
