import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';
import { DOMParser, XMLSerializer } from '@xmldom/xmldom';
import { convertBatchDocxToPdf } from '../src/pdf-converter.js';

const targetDir = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/04-2 水性环氧固化剂 EC/EC-1804';

async function cleanChineseSec2(filePath) {
  console.log(`Cleaning Chinese Sec 2: ${path.basename(filePath)}`);
  const data = fs.readFileSync(filePath);
  const zip = await JSZip.loadAsync(data);
  const xmlStr = await zip.file('word/document.xml').async('string');
  const doc = new DOMParser().parseFromString(xmlStr, 'text/xml');

  const tbl1 = doc.getElementsByTagName('w:tbl')[1];
  const ps = tbl1.getElementsByTagName('w:p');
  const toRemove = [];

  for (let i = 0; i < ps.length; i++) {
    const text = ps[i].textContent.trim();
    if (
      text.includes('GHS象形图') ||
      text.includes('信号词') ||
      text === '预防措施：' ||
      text === '废弃处置：'
    ) {
      toRemove.push(ps[i]);
      console.log(`  Removing CN P: "${text}"`);
    }
  }

  for (const p of toRemove) {
    p.parentNode.removeChild(p);
  }

  const updatedXml = new XMLSerializer().serializeToString(doc);
  zip.file('word/document.xml', updatedXml);
  const outBuf = await zip.generateAsync({ type: 'nodebuffer' });
  fs.writeFileSync(filePath, outBuf);
  console.log(`Saved cleaned DOCX: ${filePath}`);
}

async function cleanEnglishSec2(filePath) {
  console.log(`Cleaning English Sec 2: ${path.basename(filePath)}`);
  const data = fs.readFileSync(filePath);
  const zip = await JSZip.loadAsync(data);
  const xmlStr = await zip.file('word/document.xml').async('string');
  const doc = new DOMParser().parseFromString(xmlStr, 'text/xml');

  const tbl1 = doc.getElementsByTagName('w:tbl')[1];
  const ps = tbl1.getElementsByTagName('w:p');
  const toRemove = [];

  for (let i = 0; i < ps.length; i++) {
    const text = ps[i].textContent.trim();
    if (
      text.includes('GHS pictograms') ||
      text.includes('Signal word') ||
      text === 'Prevention:' ||
      text === 'Disposal:'
    ) {
      toRemove.push(ps[i]);
      console.log(`  Removing EN P: "${text}"`);
    }
  }

  for (const p of toRemove) {
    p.parentNode.removeChild(p);
  }

  const updatedXml = new XMLSerializer().serializeToString(doc);
  zip.file('word/document.xml', updatedXml);
  const outBuf = await zip.generateAsync({ type: 'nodebuffer' });
  fs.writeFileSync(filePath, outBuf);
  console.log(`Saved cleaned DOCX: ${filePath}`);
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
  await cleanChineseSec2(path.join(targetDir, 'EC-1804 msds_CN 冠志.docx'));
  await cleanChineseSec2(path.join(targetDir, 'EC-1804 msds_CN 国彩.docx'));
  await cleanEnglishSec2(path.join(targetDir, 'EC-1804 msds_EN Guanzhi.docx'));
  await cleanEnglishSec2(path.join(targetDir, 'EC-1804 msds_EN Guocai.docx'));
  await recompilePdfs();
  console.log('\nAll exogenous Section 2 elements removed and PDFs recompiled successfully!');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
