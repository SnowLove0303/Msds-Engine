import fs from 'fs';
import JSZip from 'jszip';
import { JSDOM } from 'jsdom';

const docxPath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/tests/output_adaptive/test2_single_preset_bilingual/PU-202A msds_EN Guocai.docx';
const zip = await JSZip.loadAsync(fs.readFileSync(docxPath));
const xml = await zip.file('word/document.xml').async('text');
const dom = new (new JSDOM()).window.DOMParser().parseFromString(xml, 'application/xml');

const tbls = dom.getElementsByTagName('w:tbl');
for (let t = 0; t < tbls.length; t++) {
  const tbl = tbls[t];
  const trs = tbl.getElementsByTagName('w:tr');
  for (let r = 0; r < trs.length; r++) {
    if (trs[r].textContent.includes('二甲基乙酰胺')) {
      console.log(`Found in Table index ${t}, Row ${r}:`);
      console.log(trs[r].textContent.replace(/\s+/g, ' '));
    }
  }
}
