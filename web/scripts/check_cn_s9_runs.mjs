import JSZip from 'jszip';
import fs from 'fs/promises';
import { JSDOM } from 'jsdom';

async function checkCnS9() {
  const buf = await fs.readFile('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/PA-3223/PA-3223 msds_CN 冠志.docx');
  const zip = await JSZip.loadAsync(buf);
  const xml = await zip.file('word/document.xml').async('string');
  const doc = new (new JSDOM()).window.DOMParser().parseFromString(xml, 'text/xml');
  const tbls = doc.getElementsByTagName('w:tbl');
  const s9 = tbls[8];
  const trs = s9.getElementsByTagName('w:tr');
  for (let i = 1; i <= 5; i++) {
    const c0 = trs[i].getElementsByTagName('w:tc')[0];
    const pPr = c0.getElementsByTagName('w:pPr')[0];
    const ind = pPr?.getElementsByTagName('w:ind')[0];
    const indAttrs = ind ? Array.from(ind.attributes).map(a => `${a.name}=${a.value}`).join(' ') : 'no ind';
    const runs = Array.from(c0.getElementsByTagName('w:r')).map(r => {
      const t = r.getElementsByTagName('w:t')[0]?.textContent;
      const tab = r.getElementsByTagName('w:tab').length;
      return { t, tab };
    });
    console.log(`Row ${i}: [ind: ${indAttrs}] Runs:`, JSON.stringify(runs));
  }
}

checkCnS9().catch(console.error);
