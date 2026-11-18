import fs from 'fs';
import JSZip from 'jszip';
import { JSDOM } from 'jsdom';

const docxPath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/tests/output_adaptive/test2_single_preset_bilingual/PU-202A msds_EN Guocai.docx';
const zip = await JSZip.loadAsync(fs.readFileSync(docxPath));
const xml = await zip.file('word/document.xml').async('text');
const dom = new (new JSDOM()).window.DOMParser().parseFromString(xml, 'application/xml');

const ts = dom.getElementsByTagName('w:t');
const cnSegments = [];
for (let i = 0; i < ts.length; i++) {
  const t = ts[i].textContent;
  if (/[\u4e00-\u9fa5]/.test(t)) {
    cnSegments.push(t);
  }
}
console.log(`Found ${cnSegments.length} Chinese text segments:`);
console.log(cnSegments);
