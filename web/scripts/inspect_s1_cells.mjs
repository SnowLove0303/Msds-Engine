import fs from 'node:fs';
import { DOMParser, XMLSerializer } from '@xmldom/xmldom';
globalThis.DOMParser = DOMParser;
globalThis.XMLSerializer = XMLSerializer;
import { loadDocx } from '../src/docx-engine.js';

const buf = fs.readFileSync('web/public/templates/正式模板_MSDS_CN_冠志(1).docx');
const engine = await loadDocx(buf, 'tpl.docx');
const s1 = engine.records.find(r => r.sectionNumber === 1);
s1.rows.forEach((r, idx) => {
  console.log(idx, 'cellsCount=' + r.cells.length, r.cells.map(c => JSON.stringify(c.text)).join(' | '));
});
