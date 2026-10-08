import fs from 'node:fs';
import { JSDOM } from 'jsdom';
import { loadDocx } from './src/docx-engine.js';

const dom = new JSDOM('<!doctype html><html><body></body></html>');
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

const buf = await fs.promises.readFile('./public/templates/正式模板_MSDS_CN_冠志(1).docx');
const engine = await loadDocx(buf, 'tpl.docx');
const out = [];
for (const rec of engine.records) {
  if (rec.kind !== 'table') { out.push(`PARA ${rec.id}: ${(rec.text || '').slice(0, 80)}`); continue; }
  out.push(`TABLE s${rec.sectionNumber} id=${rec.id} rows=${rec.rows.length}`);
  for (const row of rec.rows) {
    const cells = row.cells.map((c) => `[c${c.col}x${c.colspan} L=${JSON.stringify(c.labelText.slice(0, 28))} V=${JSON.stringify(c.valueText.slice(0, 40))} ed=${c.editable}]`).join(' ');
    out.push(`  R${row.index}: ${cells}`);
  }
}
await fs.promises.writeFile('F:/MSDS覆写/MSDS deepseek 工作区/tpl_structure.txt', out.join('\n'), 'utf-8');
console.log('tables:', engine.records.filter((r) => r.kind === 'table').length);
console.log('wrote /tmp/tpl_structure.txt');
