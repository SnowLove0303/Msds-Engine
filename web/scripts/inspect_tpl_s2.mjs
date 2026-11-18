import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';
import { DOMParser } from '@xmldom/xmldom';

async function checkTemplate() {
  const dir = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/public/templates';
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.docx'));
  for (const f of files) {
    const p = path.join(dir, f);
    console.log(`\n=== Template: ${f} ===`);
    const buf = fs.readFileSync(p);
    const zip = await JSZip.loadAsync(buf);
    const xml = await zip.file('word/document.xml').async('text');
    const doc = new DOMParser().parseFromString(xml, 'text/xml');
    const t2 = doc.getElementsByTagName('w:tbl')[1];
    const ps = Array.from(t2.getElementsByTagName('w:p'));
    ps.forEach((para, idx) => {
      const text = para.textContent.trim();
      const ind = para.getElementsByTagName('w:ind')[0];
      const indStr = ind ? Array.from(ind.attributes).map(a => `${a.name}="${a.value}"`).join(' ') : 'no-ind';
      console.log(`P${idx} [${indStr}]: "${text.slice(0, 60)}"`);
    });
  }
}
checkTemplate().catch(console.error);
