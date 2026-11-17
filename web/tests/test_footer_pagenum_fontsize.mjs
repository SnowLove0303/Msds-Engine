import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert';
import JSZip from 'jszip';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html><body></body></html>');
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

import { updateHeaderFooterData, W_NS } from '../src/docx-engine.js';

console.log('Testing Task 3 (REQ-03) Footer Page Number Font Size Correction...');

const tplDocx = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/dist/templates/custom/custom_mcp_template_v1_正式模板_MSDS_CN_冠志(1).docx';

async function test() {
  const zip = await JSZip.loadAsync(fs.readFileSync(tplDocx));
  const engine = { supportingXml: {} };
  for (const [name, file] of Object.entries(zip.files)) {
    if (/^word\/(?:header|footer)\d+\.xml$/.test(name)) {
      engine.supportingXml[name] = await file.async('string');
    }
  }

  updateHeaderFooterData(engine, {
    revisionDate: '2026/11/17',
    company: '广州冠志新材料科技有限公司',
    model: 'PU-6013BIO'
  });

  const updatedFooterXml = engine.supportingXml['word/footer1.xml'];
  assert(updatedFooterXml, 'word/footer1.xml should be updated');

  const fdoc = new DOMParser().parseFromString(updatedFooterXml, 'application/xml');
  const tbl = fdoc.getElementsByTagNameNS(W_NS, 'tbl')[0];
  const rows = Array.from(tbl.getElementsByTagNameNS(W_NS, 'tr'));

  // Page number is in Row 1 Cell 1
  const cellPage = rows[1].getElementsByTagNameNS(W_NS, 'tc')[1];
  const pPage = cellPage.getElementsByTagNameNS(W_NS, 'p')[0];

  // Verify paragraph pPr/rPr has sz=18 (9pt), NOT 24 (12pt)
  const pPr = pPage.getElementsByTagNameNS(W_NS, 'pPr')[0];
  const pRPr = pPr?.getElementsByTagNameNS(W_NS, 'rPr')[0];
  const pSz = pRPr?.getElementsByTagNameNS(W_NS, 'sz')[0]?.getAttributeNS(W_NS, 'val');
  assert.strictEqual(pSz, '18', 'Page number paragraph rPr sz must be 18 (9pt), not 24');

  // Verify all runs in page number paragraph have sz=18 (9pt), NOT 24
  const runs = Array.from(pPage.getElementsByTagNameNS(W_NS, 'r'));
  assert(runs.length > 0, 'Page number paragraph must contain runs');

  for (const r of runs) {
    const rPr = r.getElementsByTagNameNS(W_NS, 'rPr')[0];
    const szVal = rPr?.getElementsByTagNameNS(W_NS, 'sz')[0]?.getAttributeNS(W_NS, 'val');
    assert.strictEqual(szVal, '18', 'Every page number run sz must be 18 (9pt), not 24');
  }

  // Ensure no occurrences of sz="24" in page number paragraph
  const pageXml = new XMLSerializer().serializeToString(cellPage);
  assert(!pageXml.includes('w:val="24"'), 'Page number cell must not contain any w:val="24" attributes');

  console.log('✅ Task 3 (REQ-03) PASS: Footer Page Number font size is 100% strictly 9pt (Word 18)!');
}

test().catch(e => {
  console.error(e);
  process.exit(1);
});
