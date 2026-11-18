import JSZip from 'jszip';
import fs from 'node:fs/promises';

async function inspectSrc() {
  const src = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料/1-1 单组份水性聚氨酯树脂 PU/PU-2346A/PU-2346A/中文版/PU-2346A msds_CN 冠志.docx';
  const buf = await fs.readFile(src);
  const zip = await JSZip.loadAsync(buf);
  const xml = await zip.file('word/document.xml').async('text');
  const tbls = xml.match(/<w:tbl[\s\S]*?<\/w:tbl>/g) || [];
  const tbl3 = tbls[2];
  const trs3 = tbl3.match(/<w:tr[\s\S]*?<\/w:tr>/g) || [];
  console.log('=== SOURCE Section 3 Rows ===');
  trs3.forEach((tr, idx) => {
    const tcs = tr.match(/<w:tc[\s\S]*?<\/w:tc>/g) || [];
    const texts = tcs.map(tc => tc.replace(/<[^>]+>/g, '').trim());
    console.log(`Source Row ${idx}: ${JSON.stringify(texts)}`);
  });
}

inspectSrc().catch(console.error);
