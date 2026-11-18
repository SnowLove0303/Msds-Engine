import fs from 'node:fs';
import JSZip from 'jszip';
import { DOMParser } from '@xmldom/xmldom';

async function checkTabs() {
  const zip = await JSZip.loadAsync(fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/PA-3223/PA-3223 msds_EN Guanzhi.docx'));
  const xml = await zip.file('word/document.xml').async('text');
  const doc = new DOMParser().parseFromString(xml, 'text/xml');
  const tbls = doc.getElementsByTagName('w:tbl');
  let nonCell0Tabs = 0;
  let customTabsCount = 0;
  for (let t = 0; t < tbls.length; t++) {
    customTabsCount += tbls[t].getElementsByTagName('w:tabs').length;
    const rows = tbls[t].getElementsByTagName('w:tr');
    for (let r = 0; r < rows.length; r++) {
      const cells = rows[r].getElementsByTagName('w:tc');
      for (let c = 1; c < cells.length; c++) {
        nonCell0Tabs += cells[c].getElementsByTagName('w:tab').length;
      }
    }
  }
  console.log('Total custom <w:tabs> in English doc:', customTabsCount);
  console.log('Total <w:tab/> in value cells (c >= 1):', nonCell0Tabs);
}
checkTabs();
