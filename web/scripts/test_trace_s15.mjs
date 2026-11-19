import fs from 'fs';
import path from 'path';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html><body></body></html>');
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

const {
  buildBaseChineseEngine,
  buildBaseEnglishEngine,
  standardizeEnglishTypographyAndLabels,
  applyGlobalTypographyProjection,
  enforceStructuralTypographyInvariants
} = await import('../src/pipeline-engine.js');
const { applyGlobalTypographyProjection: applyProj } = await import('../src/universal-editor-primitives.js');

async function testS15() {
  const modelCode = 'PA-3654';
  const cnGroundTruthPath = '算法训练材料/源文件材料/2-1 单组份水性丙烯酸乳液 PA/PA-3654/PA-3654 MSDS（冠志）_源文件留存.docx';

  const baseCn = await buildBaseChineseEngine({
    modelCode,
    cnGroundTruthPath
  });

  const cnS15 = baseCn.records.find(r => r.sectionNumber === 15);
  console.log('=== CN baseCnEngine Section 15 ===');
  cnS15.rows.forEach((r, i) => {
    console.log(`Row ${i}: "${r.cells.map(c => c.text).join(' | ')}"`);
  });

  const baseEn = await buildBaseEnglishEngine({
    modelCode,
    baseCnEngine: baseCn
  });

  const enS15 = baseEn.records.find(r => r.sectionNumber === 15);
  console.log('\n=== EN baseEnEngine Section 15 (Initial) ===');
  enS15.rows.forEach((r, i) => {
    console.log(`Row ${i}: "${r.cells.map(c => c.text).join(' | ')}"`);
  });

  // Step 1: standardizeEnglishTypographyAndLabels
  standardizeEnglishTypographyAndLabels(baseEn);
  console.log('\n=== EN after standardizeEnglishTypographyAndLabels ===');
  const s15Rec1 = baseEn.records.find(r => r.sectionNumber === 15);
  s15Rec1.rows.forEach((r, i) => {
    console.log(`Row ${i}: "${r.cells.map(c => c.node?.textContent || c.text).join(' | ')}"`);
  });

  // Step 2: applyGlobalTypographyProjection
  applyProj(baseEn, true);
  console.log('\n=== EN after applyGlobalTypographyProjection ===');
  s15Rec1.rows.forEach((r, i) => {
    console.log(`Row ${i}: "${r.cells.map(c => c.node?.textContent || c.text).join(' | ')}"`);
  });

  // Step 3: enforceStructuralTypographyInvariants
  enforceStructuralTypographyInvariants(baseEn, true);
  console.log('\n=== EN after enforceStructuralTypographyInvariants ===');
  s15Rec1.rows.forEach((r, i) => {
    console.log(`Row ${i}: "${r.cells.map(c => c.node?.textContent || c.text).join(' | ')}"`);
  });
}

testS15().catch(e => console.error(e));
