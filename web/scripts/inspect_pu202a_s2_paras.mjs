import fs from 'node:fs';
import JSZip from 'jszip';
import { DOMParser } from '@xmldom/xmldom';

const srcPath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/PU-202A/PU-202A msds_CN 冠志.docx';

async function inspectS2SourceParas() {
  const buf = fs.readFileSync(srcPath);
  const zip = await JSZip.loadAsync(buf);
  const xml = await zip.file('word/document.xml').async('text');
  const doc = new DOMParser().parseFromString(xml, 'text/xml');
  const tables = doc.getElementsByTagName('w:tbl');
  const s2 = tables[1];
  const s2Row1 = s2.getElementsByTagName('w:tr')[1];
  const paras = s2Row1.getElementsByTagName('w:p');
  console.log('Total paragraphs in Source S2 Row 1:', paras.length);
  for (let i = 0; i < paras.length; i++) {
    const p = paras[i];
    const text = p.textContent.trim();
    const ind = p.getElementsByTagName('w:ind')[0];
    const indAttr = ind ? `firstLine=${ind.getAttribute('w:firstLine') || ''} left=${ind.getAttribute('w:left') || ''}` : 'no-ind';
    const b = p.getElementsByTagName('w:b').length > 0;
    const drawings = p.getElementsByTagName('w:drawing').length;
    console.log(`P${i} [bold=${b}, ind=${indAttr}, img=${drawings}]: ${text.slice(0, 80)}`);
  }
}

inspectS2SourceParas();
