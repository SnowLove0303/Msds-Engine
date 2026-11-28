import fs from 'node:fs/promises';
import JSZip from 'jszip';
import { DOMParser } from '@xmldom/xmldom';

async function dumpRow11_7(filePath, label) {
  console.log(`\n================== ${label} ==================`);
  const buf = await fs.readFile(filePath);
  const zip = await JSZip.loadAsync(buf);
  const xml = await zip.file('word/document.xml').async('text');
  const doc = new DOMParser().parseFromString(xml, 'application/xml');
  const tbls = doc.getElementsByTagName('w:tbl');
  
  for (let i = 0; i < tbls.length; i++) {
    const txt = tbls[i].textContent;
    if (txt.includes('毒理') || txt.includes('Toxicity') || txt.includes('11.1') || txt.includes('11.7') || txt.includes('生殖毒性') || txt.includes('Reproductive')) {
      const rows = tbls[i].getElementsByTagName('w:tr');
      for (let r = 0; r < rows.length; r++) {
        const rowTxt = rows[r].textContent.replace(/\s+/g, ' ').trim();
        if (rowTxt.includes('11.7') || rowTxt.includes('生殖') || rowTxt.includes('Reproductive')) {
          console.log(`Row index ${r} Text: "${rowTxt}"`);
          console.log('Row XML:\n', rows[r].toString());
          const cells = rows[r].getElementsByTagName('w:tc');
          console.log(`Cell count: ${cells.length}`);
          for (let c = 0; c < cells.length; c++) {
            const tcPr = cells[c].getElementsByTagName('w:tcPr')[0];
            const tcW = tcPr?.getElementsByTagName('w:tcW')[0]?.getAttribute('w:w');
            const gridSpan = tcPr?.getElementsByTagName('w:gridSpan')[0]?.getAttribute('w:val');
            const borders = tcPr?.getElementsByTagName('w:tcBorders')[0]?.toString();
            console.log(`  Cell ${c}: w=${tcW}, gridSpan=${gridSpan}, borders=${borders}`);
          }
        }
      }
      break;
    }
  }
}

async function run() {
  await dumpRow11_7('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/public/templates/正式模板_MSDS_CN_冠志(1).docx', '【中文母版模板】');
  await dumpRow11_7('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/public/templates/正式模板_MSDS_EN_冠志(1).docx', '【英文母版模板】');
  await dumpRow11_7('D:/冠志/TDS MSDS/1-1 单组份水性聚氨酯树脂 PU/PU-202A/PU-202A msds_CN 国彩_源文件留存.docx', '【PU-202A 源文件】');
  await dumpRow11_7('D:/冠志/TDS MSDS/1-1 单组份水性聚氨酯树脂 PU/PU-202A/PU-202A msds_CN 冠志.docx', '【当前产出 中文冠志】');
  await dumpRow11_7('D:/冠志/TDS MSDS/1-1 单组份水性聚氨酯树脂 PU/PU-202A/PU-202A msds_EN Guanzhi.docx', '【当前产出 英文冠志】');
}
run();
