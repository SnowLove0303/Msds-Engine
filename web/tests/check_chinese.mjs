import path from 'node:path';
import fs from 'node:fs';
import JSZip from 'jszip';
import { DOMParser } from '@xmldom/xmldom';

async function checkDoc() {
  const p = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/PU-202A/PU-202A msds_EN Guanzhi.docx';
  if (!fs.existsSync(p)) {
    console.log('File does not exist');
    return;
  }
  const zip = await JSZip.loadAsync(fs.readFileSync(p));
  const xml = await zip.file('word/document.xml').async('text');
  const doc = new DOMParser().parseFromString(xml, 'text/xml');
  const tNodes = doc.getElementsByTagName('w:t');
  const chineseHits = [];
  for (let i = 0; i < tNodes.length; i++) {
    const text = tNodes[i].textContent;
    if (/[\u4e00-\u9fa5]/.test(text)) {
      chineseHits.push(text);
    }
  }
  console.log(`PU-202A original Guanzhi EN Chinese nodes: ${chineseHits.length}`);
  console.log('Samples:', chineseHits);
}

checkDoc();
