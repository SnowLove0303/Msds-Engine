import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';
import { DOMParser, XMLSerializer } from '@xmldom/xmldom';
import { convertBatchDocxToPdf } from '../src/pdf-converter.js';

const targetDir = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/04-2 水性环氧固化剂 EC/EC-1804';

async function fixChineseS13(filePath) {
  console.log(`Fixing Chinese S13: ${path.basename(filePath)}`);
  const data = fs.readFileSync(filePath);
  const zip = await JSZip.loadAsync(data);
  const xmlStr = await zip.file('word/document.xml').async('string');
  const doc = new DOMParser().parseFromString(xmlStr, 'text/xml');

  const tbls = doc.getElementsByTagName('w:tbl');
  for (let t = 0; t < tbls.length; t++) {
    if (tbls[t].textContent.includes('处理注意事项') || tbls[t].textContent.includes('13.')) {
      const jcs = tbls[t].getElementsByTagName('w:jc');
      for (let j = 0; j < jcs.length; j++) {
        if (jcs[j].getAttribute('w:val') === 'both') {
          jcs[j].setAttribute('w:val', 'left');
          console.log(`Updated w:jc="both" to "left" in Table ${t}`);
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

async function fixEnglishS8(filePath) {
  console.log(`Fixing English S8: ${path.basename(filePath)}`);
  const data = fs.readFileSync(filePath);
  const zip = await JSZip.loadAsync(data);
  const xmlStr = await zip.file('word/document.xml').async('string');
  const doc = new DOMParser().parseFromString(xmlStr, 'text/xml');

  const tbls = doc.getElementsByTagName('w:tbl');
  for (let t = 0; t < tbls.length; t++) {
    if (tbls[t].textContent.includes('Exposure control') || tbls[t].textContent.includes('8.')) {
      const rows = tbls[t].getElementsByTagName('w:tr');
      if (rows.length > 3) {
        const r3 = rows[3];
        const c0 = r3.getElementsByTagName('w:tc')[0];
        if (c0 && c0.textContent.includes('Hand protection:')) {
          const szs = c0.getElementsByTagName('w:sz');
          for (let s = 0; s < szs.length; s++) {
            if (szs[s].getAttribute('w:val') === '19') {
              szs[s].setAttribute('w:val', '24');
              console.log(`Updated Hand protection w:sz to 24`);
            }
          }
          const szCss = c0.getElementsByTagName('w:szCs');
          for (let s = 0; s < szCss.length; s++) {
            if (szCss[s].getAttribute('w:val') === '19') {
              szCss[s].setAttribute('w:val', '24');
              console.log(`Updated Hand protection w:szCs to 24`);
            }
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
  await fixChineseS13(path.join(targetDir, 'EC-1804 msds_CN 冠志.docx'));
  await fixChineseS13(path.join(targetDir, 'EC-1804 msds_CN 国彩.docx'));
  await fixEnglishS8(path.join(targetDir, 'EC-1804 msds_EN Guanzhi.docx'));
  await fixEnglishS8(path.join(targetDir, 'EC-1804 msds_EN Guocai.docx'));
  await recompilePdfs();
  console.log('\nAll surgical fixes and PDF recompilations completed successfully!');
}

main().catch(err => {
  console.error('Fatal error during execution:', err);
  process.exit(1);
});
