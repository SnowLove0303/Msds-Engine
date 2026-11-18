import fs from 'node:fs';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html><body></body></html>');
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

const { loadDocx } = await import('../src/docx-engine.js');

async function main() {
  const buf = fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料/2-1 单组份水性丙烯酸乳液 PA/PA-3653/PA-3653 MSDS（冠志）.docx');
  const engine = await loadDocx(buf, 'PA-3653 MSDS（冠志）.docx');
  const parts = engine.inspectorRecords || engine.records || [];
  console.log(`Found ${parts.length} parts in engine.`);
  for (const p of parts) {
    console.log(`Sec ${p.sectionNumber} | kind: ${p.kind} | title: ${p.title} | rows: ${p.rows?.length || 0} | text: ${(p.text || '').slice(0, 50).replace(/\r?\n/g, ' ')}`);
  }
}

main().catch(console.error);
