import fs from 'node:fs';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html><body></body></html>');
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

const { loadDocx } = await import('../src/docx-engine.js');

async function main() {
  const buf = fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/public/templates/正式模板_MSDS_CN_冠志(1).docx');
  const engine = await loadDocx(buf, '正式模板_MSDS_CN_冠志(1).docx');
  const s1 = engine.records.find(r => r.sectionNumber === 1);
  s1.rows.forEach((r, idx) => console.log(idx, r.cells.map(c => c.text).join(' | ')));
}

main().catch(console.error);
