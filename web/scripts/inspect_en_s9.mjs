import fs from 'node:fs';
import { DOMParser, XMLSerializer } from '@xmldom/xmldom';
globalThis.DOMParser = DOMParser;
globalThis.XMLSerializer = XMLSerializer;
import { loadDocx } from '../src/docx-engine.js';

const buf = fs.readFileSync('web/public/templates/正式模板_MSDS_EN_冠志(1).docx');
const engine = await loadDocx(buf, 'tpl.docx');
const s9 = engine.records.find(r => r.sectionNumber === 9);
s9.rows.forEach((r, idx) => {
  console.log(idx, r.cells.map(c => JSON.stringify(c.text)).join(' | '));
});
