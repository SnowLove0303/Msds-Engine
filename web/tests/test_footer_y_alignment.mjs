import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert';
import JSZip from 'jszip';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html><body></body></html>');
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

import { updateHeaderFooterData, W_NS } from '../src/docx-engine.js';
import { recognizeFooterTopology } from '../src/template-topology-recognizer.js';

console.log('Testing Task 2 (REQ-02) Footer Y-Axis Alignment & Topology Recognition...');

const tplDocx = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/dist/templates/custom/custom_mcp_template_v1_正式模板_MSDS_CN_冠志(1).docx';
assert(fs.existsSync(tplDocx), 'Template docx must exist');

async function test() {
  const zip = await JSZip.loadAsync(fs.readFileSync(tplDocx));
  const engine = { supportingXml: {} };
  for (const [name, file] of Object.entries(zip.files)) {
    if (/^word\/(?:header|footer)\d+\.xml$/.test(name)) {
      engine.supportingXml[name] = await file.async('string');
    }
  }

  // 1. Verify Topology Recognizer returns enriched properties
  const docxXml = await zip.file('word/document.xml').async('text');
  const doc = new DOMParser().parseFromString(docxXml, 'application/xml');
  const footerTopo = await recognizeFooterTopology(zip, doc);

  assert(footerTopo.found, 'Footer topology should be found');
  assert(footerTopo.slots.revisionDate, 'Revision date slot should be recognized');
  assert(footerTopo.slots.entityModel, 'Entity model slot should be recognized');
  console.log('  -> Footer Topology recognized:', {
    container: footerTopo.containerType,
    revisionDateSlot: {
      row: footerTopo.slots.revisionDate.rowIndex,
      col: footerTopo.slots.revisionDate.cellIndex,
      vAlign: footerTopo.slots.revisionDate.vAlign,
      rowHeight: footerTopo.slots.revisionDate.rowHeightDxa
    }
  });

  // 2. Run updateHeaderFooterData
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

  // Verify Row 0 Cell 0 (Company) has vAlign=center and spacing line=0
  const cell0 = rows[0].getElementsByTagNameNS(W_NS, 'tc')[0];
  const tcPr0 = cell0.getElementsByTagNameNS(W_NS, 'tcPr')[0];
  const vAlign0 = tcPr0.getElementsByTagNameNS(W_NS, 'vAlign')[0]?.getAttributeNS(W_NS, 'val');
  assert.strictEqual(vAlign0, 'center', 'Row 0 Cell 0 must have vAlign="center"');

  const p0 = cell0.getElementsByTagNameNS(W_NS, 'p')[0];
  const spacing0 = p0.getElementsByTagNameNS(W_NS, 'pPr')[0]?.getElementsByTagNameNS(W_NS, 'spacing')[0];
  assert.strictEqual(spacing0?.getAttributeNS(W_NS, 'line'), '0', 'Row 0 Cell 0 paragraph spacing line must be 0');

  // Verify Row 0 Cell 1 (Revision Date) has vAlign=center and spacing line=0
  const cell1 = rows[0].getElementsByTagNameNS(W_NS, 'tc')[1];
  const tcPr1 = cell1.getElementsByTagNameNS(W_NS, 'tcPr')[0];
  const vAlign1 = tcPr1.getElementsByTagNameNS(W_NS, 'vAlign')[0]?.getAttributeNS(W_NS, 'val');
  assert.strictEqual(vAlign1, 'center', 'Row 0 Cell 1 must have vAlign="center" matching Cell 0');

  const p1 = cell1.getElementsByTagNameNS(W_NS, 'p')[0];
  const spacing1 = p1.getElementsByTagNameNS(W_NS, 'pPr')[0]?.getElementsByTagNameNS(W_NS, 'spacing')[0];
  assert.strictEqual(spacing1?.getAttributeNS(W_NS, 'line'), '0', 'Row 0 Cell 1 paragraph spacing line must be 0');

  const oldInd1 = p1.getElementsByTagNameNS(W_NS, 'pPr')[0]?.getElementsByTagNameNS(W_NS, 'ind')[0];
  assert(!oldInd1, 'Row 0 Cell 1 ind element must be eliminated');

  console.log('✅ Task 2 (REQ-02) PASS: Footer Y-Axis Alignment & Topology attributes strictly verified!');
}

test().catch(e => {
  console.error(e);
  process.exit(1);
});
