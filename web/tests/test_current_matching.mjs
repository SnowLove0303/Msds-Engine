import fs from 'node:fs/promises';
import path from 'node:path';
import { JSDOM } from 'jsdom';
import { loadDocx } from '../src/docx-engine.js';
import { runSmartMatching, applyMatchResultToEditor } from '../src/smart-matching.js';

const dom = new JSDOM('<!doctype html><html><body></body></html>');
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

const files = [
  'F:/MSDS覆写/MSDS/TDS MSDS (2)/TDS MSDS/产品 TDS MSDS -- WORD版本/1-1 单组份水性聚氨酯树脂 PU/PU-1007 msds_CN 冠志.docx',
  'F:/MSDS覆写/MSDS/TDS MSDS (2)/TDS MSDS/产品 TDS MSDS -- WORD版本/1-1 单组份水性聚氨酯树脂 PU/PU-1036 msds_CN 冠志.docx',
  'F:/MSDS覆写/MSDS/TDS MSDS (2)/TDS MSDS/产品 TDS MSDS -- WORD版本/1-1 单组份水性聚氨酯树脂 PU/PU-1036 msds_EN Guanzhi.docx',
  'F:/MSDS覆写/MSDS/TDS MSDS (2)/TDS MSDS/产品 TDS MSDS -- WORD版本/1-1 单组份水性聚氨酯树脂 PU/PU-202A msds_CN 冠志.docx',
  'F:/MSDS覆写/MSDS/TDS MSDS (2)/TDS MSDS/产品 TDS MSDS -- WORD版本/2-1 单组份水性丙烯酸乳液 PA/PA-3617 MSDS-CN 国彩.docx',
  'F:/MSDS覆写/MSDS/TDS MSDS (2)/TDS MSDS/产品 TDS MSDS -- WORD版本/2-1 单组份水性丙烯酸乳液 PA/PA-3615 MSDS（冠志）.docx'
];

console.log('Testing with current smart-matching.js after cellRole update:');
for (const f of files) {
  const buf = await fs.readFile(f);
  const eng = await loadDocx(buf, path.basename(f));
  const res = runSmartMatching(eng.records);
  console.log(`\n[${path.basename(f)}] Summary:`, res.summary);
  for (const s of res.matchedSections) {
    const un = s.matchedRows.filter(r => r.status === 'UNMATCHED');
    if (un.length > 0) {
      console.log(`  Sec ${s.sectionNumber} UNMATCHED (${un.length}):`, un.map(u => `${u.standardLabel}: ${(u.value || '').slice(0, 30)}`));
    }
  }
}
