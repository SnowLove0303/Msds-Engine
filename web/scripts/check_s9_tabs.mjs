import JSZip from 'jszip';
import fs from 'fs/promises';
import { JSDOM } from 'jsdom';

async function checkTabs(filePath, label) {
  const buf = await fs.readFile(filePath);
  const zip = await JSZip.loadAsync(buf);
  const xml = await zip.file('word/document.xml').async('string');
  const doc = new (new JSDOM()).window.DOMParser().parseFromString(xml, 'text/xml');
  const tbls = doc.getElementsByTagName('w:tbl');
  const s9 = tbls[8];
  const trs = s9.getElementsByTagName('w:tr');
  console.log(`\n==================== ${label} ====================`);
  for (let i = 1; i <= Math.min(trs.length - 1, 12); i++) {
    const tc = trs[i].getElementsByTagName('w:tc')[0];
    const pPr = tc.getElementsByTagName('w:pPr')[0];
    const tabs = pPr?.getElementsByTagName('w:tabs')[0];
    const tabsXml = tabs ? new (new JSDOM()).window.XMLSerializer().serializeToString(tabs) : 'none';
    const text = tc.textContent;
    console.log(`Row ${i}: "${text}" | w:tabs: ${tabsXml}`);
  }
}

async function main() {
  await checkTabs('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/PU-202A/PU-202A msds_EN Guanzhi.docx', 'PU-202A EN');
  await checkTabs('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/PA-3223/PA-3223 msds_EN Guanzhi.docx', 'PA-3223 EN');
}

main().catch(console.error);
