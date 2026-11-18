import fs from 'fs';
import JSZip from 'jszip';
import { JSDOM } from 'jsdom';

const docxPath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/tests/output_adaptive/test2_single_preset_bilingual/PU-202A msds_EN Guocai.docx';
const zip = await JSZip.loadAsync(fs.readFileSync(docxPath));
const xml = await zip.file('word/document.xml').async('text');
const dom = new (new JSDOM()).window.DOMParser().parseFromString(xml, 'application/xml');

const tbls = dom.getElementsByTagName('w:tbl');
console.log('Tables count:', tbls.length);
// Section 11 is table 10 (index 10)
const s11 = tbls[10];
const trs = s11.getElementsByTagName('w:tr');
console.log('Section 11 rows count:', trs.length);
for (let r = 0; r < trs.length; r++) {
  const tcs = trs[r].getElementsByTagName('w:tc');
  const txts = Array.from(tcs).map(tc => tc.textContent.replace(/\s+/g, ' ').trim());
  const hasCn = /[\u4e00-\u9fa5]/.test(txts.join(' '));
  console.log(`Row ${r}: [hasCn: ${hasCn}] ${txts.join(' | ')}`);
}
