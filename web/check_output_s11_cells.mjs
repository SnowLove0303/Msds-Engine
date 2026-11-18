import fs from 'node:fs/promises';
import JSZip from 'jszip';
import { DOMParser } from '@xmldom/xmldom';

async function checkOutputS11(filePath, name) {
  console.log(`\n================== ${name} ==================`);
  const buf = await fs.readFile(filePath);
  const zip = await JSZip.loadAsync(buf);
  const xml = await zip.file('word/document.xml').async('text');
  const doc = new DOMParser().parseFromString(xml, 'application/xml');
  const tbls = doc.getElementsByTagName('w:tbl');
  const s11 = tbls[10];
  const trs = s11.getElementsByTagName('w:tr');
  console.log(`Total rows in Section 11 output: ${trs.length}`);
  for (let r = 0; r < trs.length; r++) {
    const cells = trs[r].getElementsByTagName('w:tc');
    const cellTexts = Array.from(cells).map((c, i) => {
      const tcPr = c.getElementsByTagName('w:tcPr')[0];
      const tcW = tcPr?.getElementsByTagName('w:tcW')[0]?.getAttribute('w:w');
      const gridSpan = tcPr?.getElementsByTagName('w:gridSpan')[0]?.getAttribute('w:val');
      const vMerge = tcPr?.getElementsByTagName('w:vMerge')[0]?.getAttribute('w:val') || (tcPr?.getElementsByTagName('w:vMerge').length > 0 ? 'continue' : 'none');
      const borders = tcPr?.getElementsByTagName('w:tcBorders')[0] ? 'custom-border' : 'default-border';
      const txt = c.textContent.replace(/\s+/g, ' ').trim();
      return `[C${i} w=${tcW} span=${gridSpan} vMerge=${vMerge} bdr=${borders} text="${txt.slice(0, 20)}"]`;
    }).join(' ');
    console.log(`Row ${r}: ${cellTexts}`);
  }
}

async function run() {
  await checkOutputS11('D:/冠志/TDS MSDS/1-1 单组份水性聚氨酯树脂 PU/PU-202A/PU-202A msds_CN 冠志.docx', '中文冠志产出');
  await checkOutputS11('D:/冠志/TDS MSDS/1-1 单组份水性聚氨酯树脂 PU/PU-202A/PU-202A msds_EN Guanzhi.docx', '英文冠志产出');
}
run();
