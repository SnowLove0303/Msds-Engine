import fs from 'node:fs';
import JSZip from 'jszip';
import { DOMParser } from '@xmldom/xmldom';

const sourceDocx = "F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料/6-2 水性封闭型异氰酸酯固化剂 BL/BL-8126/BL-8126 msds_CN 冠志.docx";

async function run() {
  const buf = fs.readFileSync(sourceDocx);
  const zip = await JSZip.loadAsync(buf);
  const xml = await zip.file('word/document.xml').async('text');
  const doc = new DOMParser().parseFromString(xml, 'text/xml');

  const paragraphs = [];
  const pNodes = doc.getElementsByTagName('w:p');
  for (let i = 0; i < pNodes.length; i++) {
    const p = pNodes[i];
    const tNodes = p.getElementsByTagName('w:t');
    let text = '';
    for (let j = 0; j < tNodes.length; j++) {
      text += tNodes[j].textContent || '';
    }
    if (text.trim()) {
      paragraphs.push(text.trim());
    }
  }

  // Dump tables
  const tables = [];
  const tblNodes = doc.getElementsByTagName('w:tbl');
  for (let t = 0; t < tblNodes.length; t++) {
    const tbl = tblNodes[t];
    const rows = [];
    const trNodes = tbl.getElementsByTagName('w:tr');
    for (let r = 0; r < trNodes.length; r++) {
      const tr = trNodes[r];
      const cells = [];
      const tcNodes = tr.getElementsByTagName('w:tc');
      for (let c = 0; c < tcNodes.length; c++) {
        const tc = tcNodes[c];
        const pList = tc.getElementsByTagName('w:p');
        let cellText = [];
        for (let pIdx = 0; pIdx < pList.length; pIdx++) {
          let tStr = '';
          const tList = pList[pIdx].getElementsByTagName('w:t');
          for (let k = 0; k < tList.length; k++) {
            tStr += tList[k].textContent || '';
          }
          if (tStr.trim()) cellText.push(tStr.trim());
        }
        cells.push(cellText.join(' | '));
      }
      rows.push(cells);
    }
    tables.push(rows);
  }

  const report = {
    paragraphCount: paragraphs.length,
    paragraphs,
    tableCount: tables.length,
    tables
  };

  fs.writeFileSync('C:/Users/Administrator/.gemini/antigravity/brain/7f4d4b46-78e6-435a-aa29-f0d6ec194caa/scratch/bl8126_source_dump.json', JSON.stringify(report, null, 2), 'utf8');
  console.log(`Dumping completed: ${paragraphs.length} paragraphs, ${tables.length} tables.`);
}

run().catch(console.error);
