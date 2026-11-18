import { DOMParser, XMLSerializer } from '@xmldom/xmldom';
globalThis.DOMParser = DOMParser;
globalThis.XMLSerializer = XMLSerializer;

import { loadDocx } from '../src/docx-engine.js';
import fs from 'fs';

const buf = fs.readFileSync('public/templates/正式模板_MSDS_EN_冠志(1).docx');
const engine = await loadDocx(buf);
const s14 = engine.records.find(r => r.sectionNumber === 14);
console.log('S14 rows:', s14.rows.length);
s14.rows.forEach((r, idx) => {
  console.log(`Row ${idx}:`, JSON.stringify(r.cells.map(c => ({
    col: c.col,
    kind: c.kind,
    editable: c.editable,
    text: c.text
  }))));
});
