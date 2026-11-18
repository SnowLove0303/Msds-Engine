import fs from 'node:fs';
import JSZip from 'jszip';
import { DOMParser } from '@xmldom/xmldom';

const buffer = fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/PU-202B/PU-202B msds_CN 冠志.docx');
const zip = await JSZip.loadAsync(buffer);
const xmlStr = await zip.file('word/document.xml').async('text');
const doc = new DOMParser().parseFromString(xmlStr, 'application/xml');
const tbls = doc.getElementsByTagName('w:tbl');
const s11 = tbls[10];
const trs = Array.from(s11.getElementsByTagName('w:tr'));

console.log('=== 中文版 PU-202B Section 11 行结构与各单元格 ===');
trs.forEach((tr, i) => {
  const tcs = Array.from(tr.getElementsByTagName('w:tc'));
  const tcTexts = tcs.map(tc => `[span=${tc.getElementsByTagName('w:gridSpan')[0]?.getAttribute('w:val') || '1'}, vm=${tc.getElementsByTagName('w:vMerge')[0]?.getAttribute('w:val') || (tc.getElementsByTagName('w:vMerge').length ? 'continue' : 'none')}] "${tc.textContent.trim().replace(/\s+/g, ' ').slice(0, 30)}"`).join(' | ');
  console.log(`Row ${i} (tcs=${tcs.length}): ${tcTexts}`);
});
