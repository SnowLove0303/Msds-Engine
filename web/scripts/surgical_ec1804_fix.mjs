import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';
import { DOMParser, XMLSerializer } from '@xmldom/xmldom';
import { convertBatchDocxToPdf } from '../src/pdf-converter.js';

const targetDir = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/04-2 水性环氧固化剂 EC/EC-1804';

async function fixChineseDocx(filePath) {
  console.log(`Fixing Chinese DOCX: ${path.basename(filePath)}`);
  const data = fs.readFileSync(filePath);
  const zip = await JSZip.loadAsync(data);
  const xmlStr = await zip.file('word/document.xml').async('string');
  const doc = new DOMParser().parseFromString(xmlStr, 'text/xml');

  // Fix Table 8 (Section 8)
  const tbl8 = doc.getElementsByTagName('w:tbl')[7];
  if (tbl8) {
    const rows = tbl8.getElementsByTagName('w:tr');
    
    // 1. Fix Row 3 Cell 0 indent (手部防护：)
    const r3 = rows[3];
    if (r3) {
      const c0 = r3.getElementsByTagName('w:tc')[0];
      const ind = c0?.getElementsByTagName('w:ind')[0];
      if (ind) {
        ind.setAttribute('w:left', '0');
        ind.removeAttribute('w:leftChars');
        ind.removeAttribute('w:hanging');
        ind.removeAttribute('w:hangingChars');
        ind.setAttribute('w:firstLine', '482');
        ind.setAttribute('w:firstLineChars', '200');
      }
    }

    // 2. Fix Cell 1 bolding for value rows (Row 2 through Row 11)
    for (let r = 2; r < rows.length; r++) {
      const cells = rows[r].getElementsByTagName('w:tc');
      if (cells.length > 1) {
        const valCell = cells[1];
        // Remove w:b inside rPr
        const rPrs = valCell.getElementsByTagName('w:rPr');
        for (let i = 0; i < rPrs.length; i++) {
          const bs = rPrs[i].getElementsByTagName('w:b');
          while (bs.length > 0) {
            rPrs[i].removeChild(bs[0]);
          }
          const bCss = rPrs[i].getElementsByTagName('w:bCs');
          while (bCss.length > 0) {
            rPrs[i].removeChild(bCss[0]);
          }
        }
      }
    }
  }

  const updatedXml = new XMLSerializer().serializeToString(doc);
  zip.file('word/document.xml', updatedXml);
  const outBuf = await zip.generateAsync({ type: 'nodebuffer' });
  fs.writeFileSync(filePath, outBuf);
  console.log(`Saved updated DOCX: ${filePath}`);
}

async function fixEnglishDocx(filePath) {
  console.log(`Fixing English DOCX: ${path.basename(filePath)}`);
  const data = fs.readFileSync(filePath);
  const zip = await JSZip.loadAsync(data);
  let xmlStr = await zip.file('word/document.xml').async('string');

  // Align P501 translation
  const oldP501 = 'Dispose of contents/container in accordance with local regulations.';
  const newP501 = 'Dispose of contents/container to an approved waste disposal plant.';
  if (xmlStr.includes(oldP501)) {
    xmlStr = xmlStr.replace(oldP501, newP501);
    console.log(`Replaced P501 translation in ${path.basename(filePath)}`);
  }

  zip.file('word/document.xml', xmlStr);
  const outBuf = await zip.generateAsync({ type: 'nodebuffer' });
  fs.writeFileSync(filePath, outBuf);
  console.log(`Saved updated DOCX: ${filePath}`);
}

async function recompilePdfs() {
  console.log('\n--- Recompiling 4 MSDS PDFs ---');
  const docxNames = [
    'EC-1804 msds_CN 冠志.docx',
    'EC-1804 msds_CN 国彩.docx',
    'EC-1804 msds_EN Guanzhi.docx',
    'EC-1804 msds_EN Guocai.docx'
  ];

  const items = docxNames.map(name => {
    const fullPath = path.join(targetDir, name);
    return {
      fileName: name,
      docxBuffer: fs.readFileSync(fullPath)
    };
  });

  const pdfResults = await convertBatchDocxToPdf(items, { timeoutMs: 120000 });
  for (const res of pdfResults) {
    const outPdfPath = path.join(targetDir, res.pdfName);
    fs.writeFileSync(outPdfPath, res.pdfBuffer);
    console.log(`Wrote fresh PDF: ${outPdfPath} (${res.pdfBuffer.length} bytes)`);
  }

  // Synchronize timestamps
  const now = new Date();
  for (const name of docxNames) {
    const dPath = path.join(targetDir, name);
    const pPath = path.join(targetDir, name.replace('.docx', '.pdf'));
    fs.utimesSync(dPath, now, now);
    fs.utimesSync(pPath, now, now);
  }
  console.log('Synchronized timestamps for all 8 MSDS files.');
}

async function main() {
  await fixChineseDocx(path.join(targetDir, 'EC-1804 msds_CN 冠志.docx'));
  await fixChineseDocx(path.join(targetDir, 'EC-1804 msds_CN 国彩.docx'));
  await fixEnglishDocx(path.join(targetDir, 'EC-1804 msds_EN Guanzhi.docx'));
  await fixEnglishDocx(path.join(targetDir, 'EC-1804 msds_EN Guocai.docx'));
  await recompilePdfs();
  console.log('\nAll surgical fixes and PDF recompilations completed successfully!');
}

main().catch(err => {
  console.error('Fatal error during execution:', err);
  process.exit(1);
});
