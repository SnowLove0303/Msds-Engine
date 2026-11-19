import fs from 'node:fs/promises';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html><body></body></html>');
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

const { buildBaseChineseEngine } = await import('../src/pipeline-engine.js');

const modelCode = 'PA-4914';
const sourcePath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料/2-4 水溶性丙烯酸树脂 PA/PA-4914/PA-4914 msds_CN 冠志.docx';
const srcBuf = await fs.readFile(sourcePath);

const eng = await buildBaseChineseEngine({
  modelCode,
  sourceDocxBuffer: srcBuf,
  facts: { modelCode, isHazardous: true }
});

const s8 = eng.records.find(r => r.sectionNumber === 8);
console.log(`Section 8 rows count: ${s8.rows.length}`);
for (let i = 0; i < s8.rows.length; i++) {
  const row = s8.rows[i];
  console.log(`R${i} (cells: ${row.cells.length}): ${row.cells.map(c => (c.text||'').trim()).join(' || ')}`);
}
