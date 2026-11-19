import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html><body></body></html>');
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

import { buildBaseChineseEngine, buildBaseEnglishEngine } from '../src/pipeline-engine.js';

async function verify() {
  const p = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料/2-1 单组份水性丙烯酸乳液 PA/PA-3654/PA-3654 MSDS（冠志）_源文件留存.docx';
  const buf = fs.readFileSync(p);

  console.log('--- 1. Building baseCnEngine ---');
  const baseCnEngine = await buildBaseChineseEngine({
    modelCode: 'PA-3654',
    sourceDocxBuffer: buf
  });

  // Verify Section 1
  const s1 = baseCnEngine.records.find(r => r.sectionNumber === 1);
  const row1Text = (s1.rows[1]?.cells[1]?.text || '').trim();
  const row2Text = (s1.rows[2]?.cells[1]?.text || '').trim();
  console.log('CN S1 Row 1 (Model):', row1Text);
  console.log('CN S1 Row 2 (Name+Model):', row2Text);
  if (row1Text !== 'PA-3654') throw new Error(`CN S1 Row 1 expected PA-3654, got "${row1Text}"`);
  if (!row2Text.includes('水性丙烯酸乳液') || !row2Text.includes('PA-3654')) throw new Error(`CN S1 Row 2 expected "水性丙烯酸乳液 PA-3654", got "${row2Text}"`);

  // Verify Section 8
  const s8 = baseCnEngine.records.find(r => r.sectionNumber === 8);
  const fkmRow = s8.rows.find(r => /FKM/i.test(r.cells[0]?.text || ''));
  const fkmVal = (fkmRow?.cells[fkmRow.cells.length - 1]?.text || '').trim();
  console.log('CN S8 FKM Val:', fkmVal);
  if (!fkmVal || fkmVal.length === 0) throw new Error('CN S8 FKM Val is empty!');

  // Verify Section 11
  const s11 = baseCnEngine.records.find(r => r.sectionNumber === 11);
  const s11All = s11.rows.map(r => r.cells.map(c => c.text || '').join(' ')).join(' ');
  console.log('CN S11 Rows count:', s11.rows.length);
  console.log('CN S11 Row 1 cells:', s11.rows[1]?.cells.map(c => c.text || ''));
  if (s11All.includes('该产品无可用的毒理学研究')) throw new Error('CN S11 contains fabricated preamble!');
  if (s11All.includes('下面是这些成分的毒理学数据')) throw new Error('CN S11 contains fabricated preamble 2!');
  if (!s11All.includes('LD50') || !s11All.includes('2,000')) throw new Error('CN S11 missing real source LD50 endpoint!');

  // Verify Section 13
  const s13 = baseCnEngine.records.find(r => r.sectionNumber === 13);
  console.log('CN S13 Rows count:', s13.rows.length);
  s13.rows.forEach((r, idx) => {
    console.log(`CN S13 Row ${idx}: [${r.cells.map(c => `"${c.text || ''}"`).join(', ')}]`);
  });
  if (s13.rows.length !== 4) throw new Error(`CN S13 expected 4 rows, got ${s13.rows.length}`);
  if (!(s13.rows[1]?.cells[0]?.text || '').trim()) throw new Error('CN S13 Row 1 is empty!');
  if (!(s13.rows[2]?.cells[0]?.text || '').trim()) throw new Error('CN S13 Row 2 is empty!');
  if (!(s13.rows[3]?.cells[1]?.text || '').trim()) throw new Error('CN S13 Row 3 is empty!');

  // Verify Section 14
  const s14 = baseCnEngine.records.find(r => r.sectionNumber === 14);
  const s14All = s14.rows.map(r => r.cells.map(c => c.text || '').join(' ')).join(' ');
  console.log('CN S14 summary:');
  s14.rows.forEach((r, idx) => {
    console.log(`CN S14 Row ${idx}: [${r.cells.map(c => `"${c.text || ''}"`).join(', ')}]`);
  });
  if (!s14All.includes('公路运输规范')) throw new Error('CN S14 missing source road text!');
  if (!s14All.includes('IMDG CODE')) throw new Error('CN S14 missing source IMDG CODE text!');
  if (!s14All.includes('IATA')) throw new Error('CN S14 missing source IATA text!');
  if (!s14All.includes('50℃') || !s14All.includes('-5℃')) throw new Error('CN S14 missing source temperature limits!');

  // Verify Section 15
  const s15 = baseCnEngine.records.find(r => r.sectionNumber === 15);
  const s15All = s15.rows.map(r => r.cells.map(c => c.text || '').join(' ')).join(' ');
  console.log('CN S15 Rows count:', s15.rows.length);
  if (s15All.includes('15258')) throw new Error('CN S15 contains GB 15258 which was not in source!');

  console.log('\n--- 2. Building baseEnEngine ---');
  const baseEnEngine = await buildBaseEnglishEngine({
    modelCode: 'PA-3654',
    baseCnEngine
  });

  // Verify English Section 1
  const s1En = baseEnEngine.records.find(r => r.sectionNumber === 1);
  console.log('EN S1 Row 1:', s1En.rows[1]?.cells[1]?.text);
  console.log('EN S1 Row 2:', s1En.rows[2]?.cells[1]?.text);

  // Verify English Section 8
  const s8En = baseEnEngine.records.find(r => r.sectionNumber === 8);
  const engControlsRow = s8En.rows.find(r => /Engineering controls/i.test(r.cells[0]?.text || ''));
  console.log('EN S8 Engineering controls:', engControlsRow?.cells[1]?.text);
  if (!(engControlsRow?.cells[1]?.text || '').trim()) throw new Error('EN S8 Engineering controls is empty!');

  // Verify English Section 11
  const s11En = baseEnEngine.records.find(r => r.sectionNumber === 11);
  const s11EnAll = s11En.rows.map(r => r.cells.map(c => c.text || '').join(' ')).join(' ');
  console.log('EN S11 Rows count:', s11En.rows.length);
  if (s11EnAll.includes('No toxicological studies are available on the product')) throw new Error('EN S11 contains fabricated preamble!');
  if (!s11EnAll.includes('LD50') || !s11EnAll.includes('2,000')) throw new Error('EN S11 missing translated LD50!');

  // Verify English Section 14
  const s14En = baseEnEngine.records.find(r => r.sectionNumber === 14);
  const s14EnAll = s14En.rows.map(r => r.cells.map(c => c.text || '').join(' ')).join(' ');
  console.log('EN S14 summary:');
  s14En.rows.forEach((r, idx) => {
    console.log(`EN S14 Row ${idx}: [${r.cells.map(c => `"${c.text || ''}"`).join(', ')}]`);
  });
  if (!s14EnAll.includes('IMDG Code')) throw new Error('EN S14 missing IMDG Code!');
  if (!s14EnAll.includes('IATA')) throw new Error('EN S14 missing IATA!');

  console.log('\nALL VERIFICATION CHECKS PASSED WITH 100% SUCCESS!');
}

verify().catch(e => {
  console.error('VERIFICATION ERROR:', e);
  process.exit(1);
});
