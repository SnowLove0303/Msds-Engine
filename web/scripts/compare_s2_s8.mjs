import fs from 'fs';
import JSZip from 'jszip';
import { DOMParser } from '@xmldom/xmldom';

async function extractDocx(docxPath) {
  const data = fs.readFileSync(docxPath);
  const zip = await JSZip.loadAsync(data);
  const xml = await zip.file('word/document.xml').async('string');
  return { xml, doc: new DOMParser().parseFromString(xml, 'text/xml') };
}

async function run() {
  const src = await extractDocx('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料/4-2 水性环氧固化剂 EC/EC-1804/EC-1804 msds_CN 冠志(1)_源文件留存.docx');
  const cn = await extractDocx('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/04-2 水性环氧固化剂 EC/EC-1804/EC-1804 msds_CN 冠志.docx');
  const en = await extractDocx('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/04-2 水性环氧固化剂 EC/EC-1804/EC-1804 msds_EN Guanzhi.docx');

  console.log('=== SECTION 2 COMPARISON ===');
  // Get all text of Section 2 from src, cn, en
  function getSec(doc, num) {
    const tbls = doc.getElementsByTagName('w:tbl');
    for (let i = 0; i < tbls.length; i++) {
      const t = tbls[i];
      const text = t.textContent || '';
      if (text.includes(`${num}.`) || text.includes(`${num}、`)) {
        return t;
      }
    }
    return null;
  }

  const s2Src = getSec(src.doc, 2);
  const s2Cn = getSec(cn.doc, 2);
  const s2En = getSec(en.doc, 2);

  console.log('--- S2 SRC Text ---');
  console.log(s2Src?.textContent);
  console.log('--- S2 CN Text ---');
  console.log(s2Cn?.textContent);
  console.log('--- S2 EN Text ---');
  console.log(s2En?.textContent);

  console.log('\n=== SECTION 8 COMPARISON ===');
  const s8Src = getSec(src.doc, 8);
  const s8Cn = getSec(cn.doc, 8);
  const s8En = getSec(en.doc, 8);

  console.log('--- S8 SRC Text ---');
  console.log(s8Src?.textContent);
  console.log('--- S8 CN Text ---');
  console.log(s8Cn?.textContent);
  console.log('--- S8 EN Text ---');
  console.log(s8En?.textContent);
}

run().catch(console.error);
