import fs from 'node:fs';
import path from 'node:path';
import { DOMParser, XMLSerializer } from '@xmldom/xmldom';
globalThis.DOMParser = DOMParser;
globalThis.XMLSerializer = XMLSerializer;
import { loadDocx } from '../src/docx-engine.js';

const buf = fs.readFileSync('output/test_workflow_decoupling/OS-8970_test_CN_Guanzhi.docx');
const engine = await loadDocx(buf, 'test.docx');
const s1 = engine.records.find(r => r.sectionNumber === 1);
s1.rows.forEach((r, idx) => {
  console.log(idx, 'cellsCount=' + r.cells.length, r.cells.map(c => JSON.stringify(c.text)).join(' | '));
});
