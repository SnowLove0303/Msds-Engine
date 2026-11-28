import fs from 'node:fs/promises';
import { JSDOM } from 'jsdom';
import JSZip from 'jszip';
import { loadDocx } from './src/docx-engine.js';
const dom = new JSDOM();
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

async function verifyAll() {
  const cnBuf = await fs.readFile('../算法训练材料/EP-1702/EP-1702 msds_CN 冠志.docx');
  const enBuf = await fs.readFile('../算法训练材料/EP-1702/EP-1702 msds_EN 冠志.docx');

  const cnZip = await JSZip.loadAsync(cnBuf);
  const cnXml = await cnZip.file('word/document.xml').async('text');

  console.log('=== VERIFY SECTION 2 CN XML (IND & TABS) ===');
  const s2Idx = cnXml.indexOf('2.危险性概述');
  const tblStart = cnXml.lastIndexOf('<w:tbl', s2Idx);
  const tblEnd = cnXml.indexOf('</w:tbl>', s2Idx) + 8;
  const tblXml = cnXml.substring(tblStart, tblEnd);

  const trs = tblXml.match(/<w:tr[\s>].*?<\/w:tr>/gs) || [];
  trs.forEach((tr, i) => {
    const tcs = tr.match(/<w:tc[\s>].*?<\/w:tc>/gs) || [];
    tcs.forEach((tc, j) => {
      const indMatch = tc.match(/<w:ind[^>]*\/>/);
      const tabMatch = tc.match(/<w:tabs>.*?<\/w:tabs>/s);
      const tMatches = tc.match(/<w:t[^>]*>(.*?)<\/w:t>/g) || [];
      const text = tMatches.map(t => t.replace(/<[^>]+>/g, '')).join('');
      console.log(`CN Row ${i} Col ${j} [${text.slice(0, 30)}]:\n   ind=${indMatch ? indMatch[0] : 'NONE'}\n   tabs=${tabMatch ? tabMatch[0] : 'NONE'}`);
    });
  });

  const cnEng = await loadDocx(cnBuf, 'cn');
  const enEng = await loadDocx(enBuf, 'en');

  console.log('\n=== VERIFY SECTION 12 CN ROWS ===');
  const s12 = cnEng.records.find(r => r.sectionNumber === 12);
  s12.rows.forEach((r, i) => {
    console.log(`S12 Row ${i}: ${r.cells.map(c => c.text).join(' | ')}`);
  });

  console.log('\n=== VERIFY SECTION 12 EN ROWS ===');
  const s12En = enEng.records.find(r => r.sectionNumber === 12);
  s12En.rows.forEach((r, i) => {
    console.log(`S12-EN Row ${i}: ${r.cells.map(c => c.text).join(' | ')}`);
  });

  console.log('\n=== VERIFY PUNCTUATION IN CN (Sections 4, 7, 12) ===');
  const s4 = cnEng.records.find(r => r.sectionNumber === 4);
  console.log('S4 接触皮肤:', s4.rows.find(r => r.cells[0]?.text.includes('皮肤'))?.cells[1]?.text);
  const s7 = cnEng.records.find(r => r.sectionNumber === 7);
  console.log('S7 安全操作:', s7.rows.find(r => r.cells[0]?.text.includes('安全操作'))?.cells[1]?.text);
}
verifyAll();
