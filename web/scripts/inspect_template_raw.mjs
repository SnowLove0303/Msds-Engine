import fs from 'node:fs';
import JSZip from 'jszip';
import { DOMParser } from '@xmldom/xmldom';

const tplPath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/public/templates/正式模板_MSDS_CN_冠志(1).docx';

async function inspectTemplate() {
  const buf = fs.readFileSync(tplPath);
  const zip = await JSZip.loadAsync(buf);
  const xml = await zip.file('word/document.xml')?.async('text');
  const doc = new DOMParser().parseFromString(xml, 'text/xml');
  const tbls = Array.from(doc.getElementsByTagName('w:tbl'));

  console.log('================ 官方母版正式模板_MSDS_CN_冠志(1).docx 原始内容探查 ================');
  tbls.forEach((t, idx) => {
    const s = idx + 1;
    const txt = (t.textContent || '').replace(/\s+/g, ' ').trim();
    if ([2, 3, 4, 5, 6, 7, 8, 9, 11, 12, 13, 14, 15, 16].includes(s)) {
      console.log(`\n[母版 Section ${s}] (长度 ${txt.length}):`);
      console.log(`   ${txt.substring(0, 180)}...`);
    }
  });
}

inspectTemplate().catch(console.error);
