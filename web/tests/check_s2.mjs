import path from 'node:path';
import fs from 'node:fs';
import JSZip from 'jszip';
import { DOMParser } from '@xmldom/xmldom';

async function checkS2() {
  const p = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/tests/output_adaptive/test2_single_preset_bilingual/PU-202A msds_CN 国彩.docx';
  const zip = await JSZip.loadAsync(fs.readFileSync(p));
  const xml = await zip.file('word/document.xml').async('text');
  const doc = new DOMParser().parseFromString(xml, 'text/xml');
  const tbls = doc.getElementsByTagName('w:tbl');
  const s2 = tbls[1];
  const trs = Array.from(s2.getElementsByTagName('w:tr'));
  console.log(`S2 trs length: ${trs.length}`);
  trs.forEach((tr, i) => {
    console.log(`Row ${i}: "${tr.textContent.trim().replace(/\s+/g, ' ')}"`);
  });
}

checkS2();
