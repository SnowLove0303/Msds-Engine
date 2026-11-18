import JSZip from 'jszip';
import fs from 'fs/promises';
import { JSDOM } from 'jsdom';

async function inspectTemplate(tplPath, label) {
  console.log(`\n==================== ${label} ====================`);
  const buf = await fs.readFile(tplPath);
  const zip = await JSZip.loadAsync(buf);
  const xml = await zip.file('word/document.xml').async('string');
  const doc = new (new JSDOM()).window.DOMParser().parseFromString(xml, 'text/xml');
  const tbls = doc.getElementsByTagName('w:tbl');
  const s9 = tbls[8];
  const trs = s9.getElementsByTagName('w:tr');
  console.log('Template Section 9 row count:', trs.length);
  for (let i = 1; i < trs.length; i++) {
    const tc = trs[i].getElementsByTagName('w:tc')[0];
    const text = tc.textContent;
    const pPr = tc.getElementsByTagName('w:pPr')[0];
    const ind = pPr?.getElementsByTagName('w:ind')[0];
    const indAttrs = ind ? Array.from(ind.attributes).map(a => `${a.name}=${a.value}`).join(' ') : 'no ind';
    const tabs = Array.from(tc.getElementsByTagName('w:tab')).length;
    const tabPr = pPr?.getElementsByTagName('w:tabs')[0];
    const tabPrXml = tabPr ? new (new JSDOM()).window.XMLSerializer().serializeToString(tabPr) : 'none';
    const runs = Array.from(tc.getElementsByTagName('w:r')).map(r => r.textContent);
    console.log(`Row ${i.toString().padStart(2, ' ')}: [ind: ${indAttrs}] [tabs: ${tabs}] [w:tabs: ${tabPrXml}] [Text: "${text}"] | Runs: ${JSON.stringify(runs)}`);
  }
}

async function main() {
  await inspectTemplate('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/public/templates/正式模板_MSDS_CN_冠志(1).docx', '正式模板 CN');
  await inspectTemplate('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/public/templates/正式模板_MSDS_EN_冠志(1).docx', '正式模板 EN');
}

main().catch(console.error);
