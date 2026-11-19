import fs from 'node:fs/promises';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html><body></body></html>');
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

const { buildBaseChineseEngine } = await import('../src/pipeline-engine.js');
const { writeCellValue, addRowAfter, deleteRow, loadDocx } = await import('../src/docx-engine.js');

const sourcePath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料/2-4 水溶性丙烯酸树脂 PA/PA-4914/PA-4914 msds_CN 冠志.docx';
const srcBuf = await fs.readFile(sourcePath);

const baseCn = await buildBaseChineseEngine({
  modelCode: 'PA-4914',
  sourceDocxBuffer: srcBuf,
  facts: { modelCode: 'PA-4914', isHazardous: true }
});

let s8 = baseCn.records.find(r => r.sectionNumber === 8);
const engRow = s8.rows.find(r => /工程控制/i.test(r.cells[0]?.text || ''));
console.log('engRow found:', !!engRow, 'cells:', engRow?.cells?.length);
engRow.cells[1].editable = true;
writeCellValue(engRow.cells[1], '使用局部排风或全面通风，保持工作场所空气中浓度低于职业接触限值；工作场所设置洗眼器与安全淋浴设施。');
console.log('engRow text after write:', engRow.cells[1].text);

s8 = addRowAfter(baseCn, s8, 13);
const r14 = s8.rows[14];
for (const c of r14.cells) { c.editable = true; c.role = 'value'; }
writeCellValue(r14.cells[0], '丙二醇甲醚');
writeCellValue(r14.cells[1], 'ACGIH');
writeCellValue(r14.cells[2], 'TLVTN');
writeCellValue(r14.cells[3], '100ppm,606 mg/m3');

console.log('baseCn s8 rows before export:', s8.rows.length);
console.log('r14 text:', s8.rows[14].cells.map(c => c.text).join(' | '));

const buf = await baseCn.exportArrayBuffer();
const reloaded = await loadDocx(buf, 'reloaded.docx');
const s8Reloaded = reloaded.records.find(r => r.sectionNumber === 8);
const {
  bindEntityPresetToDocument,
  applyGlobalTypographyProjection
} = await import('../src/universal-editor-primitives.js');

const {
  enforceStructuralTypographyInvariants,
  enforceGlobalLeftAlignmentAndCleanIndent
} = await import('../src/pipeline-engine.js');

const { getPresetById } = await import('../src/msds-db.js');

const preset = await getPresetById('preset_guanzhi_cn');

console.log('Testing each step on reloaded engine...');
bindEntityPresetToDocument(reloaded, preset, { isEnglish: false, modelCode: 'PA-4914' });
console.log('After bindEntityPresetToDocument s8 rows:', reloaded.records.find(r => r.sectionNumber === 8).rows.length);

applyGlobalTypographyProjection(reloaded, false);
console.log('After applyGlobalTypographyProjection s8 rows:', reloaded.records.find(r => r.sectionNumber === 8).rows.length);

enforceStructuralTypographyInvariants(reloaded, false);
console.log('After enforceStructuralTypographyInvariants s8 rows:', reloaded.records.find(r => r.sectionNumber === 8).rows.length);

enforceGlobalLeftAlignmentAndCleanIndent(reloaded, false);
console.log('After enforceGlobalLeftAlignmentAndCleanIndent s8 rows:', reloaded.records.find(r => r.sectionNumber === 8).rows.length);

