import fs from 'node:fs';
import path from 'node:path';
import { DOMParser, XMLSerializer } from '@xmldom/xmldom';
globalThis.DOMParser = DOMParser;
globalThis.XMLSerializer = XMLSerializer;
import { loadDocx } from '../src/docx-engine.js';
import { recognizeSourceDocx } from '../src/msds-source-semantic-adapter.js';

const sampleSource = path.resolve('算法训练材料/源文件材料/水性噁唑啉交联剂/OS-8970/OS-8970 msds_CN 冠志.docx');
const context1 = await recognizeSourceDocx(sampleSource, path.basename(sampleSource));
console.log('--- context1.physicalProperties ---');
console.log(context1.physicalProperties);

const buf = fs.readFileSync('output/test_workflow_decoupling/OS-8970_test_CN_Guanzhi.docx');
const engine = await loadDocx(buf, 'test.docx');
const s9 = engine.records.find(r => r.sectionNumber === 9);
console.log('--- Section 9 rows in generated docx ---');
s9.rows.forEach((r, idx) => {
  console.log(idx, r.cells.map(c => JSON.stringify(c.text)).join(' | '));
});
