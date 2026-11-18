import path from 'node:path';
import fs from 'node:fs';
import JSZip from 'jszip';
import { DOMParser } from '@xmldom/xmldom';

async function checkP960() {
  const p = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/tests/output_adaptive/test2_single_preset_bilingual/PU-202A msds_CN 国彩.docx';
  const zip = await JSZip.loadAsync(fs.readFileSync(p));
  const xml = await zip.file('word/document.xml').async('text');
  const doc = new DOMParser().parseFromString(xml, 'text/xml');
  const tbls = doc.getElementsByTagName('w:tbl');
  const s2 = tbls[1];
  const ps = Array.from(s2.getElementsByTagName('w:p'));
  for (const pEl of ps) {
    const text = pEl.textContent.trim();
    if (/^P\d{3}/.test(text) || /其他/.test(text)) {
      const ind = pEl.getElementsByTagName('w:ind')[0];
      const left = ind?.getAttribute('w:left');
      const hanging = ind?.getAttribute('w:hanging');
      const b = pEl.getElementsByTagName('w:b')[0];
      console.log(`P: "${text.slice(0, 30)}..." left=${left} hanging=${hanging} hasBold=${Boolean(b)}`);
    }
  }
}

checkP960();
