import JSZip from 'jszip';
import fs from 'fs';
import { DOMParser } from '@xmldom/xmldom';

const cnDocx = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/06-1 水分散型异氰酸酯固化剂 OS/OS-9547 PGDA80/OS-9547 PGDA80 msds_CN 冠志.docx';
const enDocx = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/06-1 水分散型异氰酸酯固化剂 OS/OS-9547 PGDA80/OS-9547 PGDA80 msds_EN Guanzhi.docx';
const srcDocx = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料/6-2 水性封闭型异氰酸酯固化剂 BL/OS-9547PGDA80/OS-9547 PGDA80 msds_CN 冠志.docx';

async function parseDoc(file) {
  const zip = await JSZip.loadAsync(fs.readFileSync(file));
  const xml = await zip.file('word/document.xml').async('text');
  return new DOMParser().parseFromString(xml, 'text/xml');
}

function extractAllTexts(doc) {
  const elements = [];
  const body = doc.getElementsByTagName('w:body')[0];
  if (!body) return elements;
  for (let i = 0; i < body.childNodes.length; i++) {
    const node = body.childNodes[i];
    if (node.nodeName === 'w:p') {
      const text = node.textContent?.trim();
      if (text) elements.push({ type: 'p', text });
    } else if (node.nodeName === 'w:tbl') {
      const rows = [];
      const trs = node.getElementsByTagName('w:tr');
      for (let r = 0; r < trs.length; r++) {
        const rowCells = [];
        const tcs = trs[r].getElementsByTagName('w:tc');
        for (let c = 0; c < tcs.length; c++) {
          rowCells.push(tcs[c].textContent?.trim() || '');
        }
        rows.push(rowCells);
      }
      elements.push({ type: 'tbl', rows });
    }
  }
  return elements;
}

async function run() {
  const cnElems = extractAllTexts(await parseDoc(cnDocx));
  const enElems = extractAllTexts(await parseDoc(enDocx));
  const srcElems = extractAllTexts(await parseDoc(srcDocx));

  console.log('\n=== Check Section 11 Details ===');
  for (const el of cnElems) {
    if (el.type === 'tbl') {
      const txt = JSON.stringify(el.rows);
      if (txt.includes('毒性') || txt.includes('半数致死')) {
        el.rows.forEach(r => console.log('  CN S11:', r.join(' | ')));
      }
    }
  }
  for (const el of enElems) {
    if (el.type === 'tbl') {
      const txt = JSON.stringify(el.rows);
      if (txt.includes('Toxicological') || txt.includes('LD50') || txt.includes('irritation')) {
        el.rows.forEach(r => console.log('  EN S11:', r.join(' | ')));
      }
    }
  }

  console.log('\n=== Check Section 12 Details ===');
  for (const el of cnElems) {
    if (el.type === 'tbl') {
      const txt = JSON.stringify(el.rows);
      if (txt.includes('生态') || txt.includes('下水道')) {
        el.rows.forEach(r => console.log('  CN S12:', r.join(' | ')));
      }
    }
  }
  for (const el of enElems) {
    if (el.type === 'tbl') {
      const txt = JSON.stringify(el.rows);
      if (txt.includes('Ecological') || txt.includes('drains') || txt.includes('courses')) {
        el.rows.forEach(r => console.log('  EN S12:', r.join(' | ')));
      }
    }
  }

  console.log('\n=== Check Source Document Section 14 & 15 ===');
  for (const el of srcElems) {
    if (el.type === 'tbl') {
      const txt = JSON.stringify(el.rows);
      if (txt.includes('运输') || txt.includes('法规') || txt.includes('344') || txt.includes('591') || txt.includes('35')) {
        el.rows.forEach(r => console.log('  SRC S14/S15:', r.join(' | ')));
      }
    }
  }
}

run().catch(console.error);
