import fs from 'fs';
import { DOMParser, XMLSerializer } from '@xmldom/xmldom';
global.DOMParser = DOMParser;
global.XMLSerializer = XMLSerializer;
import { loadDocx } from '../src/docx-engine.js';

function inspectS8Details(filePath, title) {
  const buf = fs.readFileSync(filePath);
  const engine = parseDoc(buf);
  console.log(`\n================== ${title} ==================`);
  const s8 = engine.records.find(r => r.sectionNumber === 8);
  if (!s8) {
    console.log('No Section 8');
    return;
  }
  s8.rows.forEach((r, idx) => {
    const c0 = r.cells[0];
    const c1 = r.cells[1];
    const c0Text = c0 ? c0.text.replace(/\r?\n/g, ' ') : '<NONE>';
    const c1Text = c1 ? c1.text.replace(/\r?\n/g, ' ') : '<NONE>';
    const W_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
    const c0Span = c0?.node?.getElementsByTagNameNS(W_NS, 'gridSpan')?.[0]?.getAttribute('w:val') || '1';
    const c0Width = c0?.node?.getElementsByTagNameNS(W_NS, 'tcW')?.[0]?.getAttribute('w:w') || 'auto';
    console.log(`  Row ${idx} (cells: ${r.cells.length}): [C0 (span=${c0Span}, w=${c0Width}): "${c0Text}"] | [C1: "${c1Text}"]`);
  });
}

function parseDoc(buf) {
  // Synchronous load via docx-engine
  return loadDocxSync(buf);
}

// Write async wrapper
import { loadDocx as loadAsync } from '../src/docx-engine.js';
async function run() {
  const srcEngine = await loadAsync(fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料/4-2 水性环氧固化剂 EC/EC-1804/EC-1804 msds_CN 冠志(1).docx'));
  const tplEngine = await loadAsync(fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/public/templates/正式模板_MSDS_CN_冠志(1).docx'));
  const cnEngine = await loadAsync(fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/04-2 水性环氧固化剂 EC/EC-1804/EC-1804 msds_CN 冠志.docx'));
  const enEngine = await loadAsync(fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/04-2 水性环氧固化剂 EC/EC-1804/EC-1804 msds_EN Guanzhi.docx'));

  printEngineS8(srcEngine, 'EC-1804 SOURCE');
  printEngineS8(tplEngine, 'OFFICIAL TEMPLATE');
  printEngineS8(cnEngine, 'EC-1804 CN DELIVERABLE');
  printEngineS8(enEngine, 'EC-1804 EN DELIVERABLE');
}

function printEngineS8(engine, title) {
  console.log(`\n================== ${title} ==================`);
  const s8 = engine.records.find(r => r.sectionNumber === 8);
  if (!s8) {
    console.log('No Section 8');
    return;
  }
  const W_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
  s8.rows.forEach((r, idx) => {
    const c0 = r.cells[0];
    const c1 = r.cells[1];
    const c0Text = c0 ? c0.text.replace(/\r?\n/g, ' ') : '<NONE>';
    const c1Text = c1 ? c1.text.replace(/\r?\n/g, ' ') : '<NONE>';
    const c0Span = c0?.node?.getElementsByTagNameNS(W_NS, 'gridSpan')?.[0]?.getAttribute('w:val') || '1';
    const c0Width = c0?.node?.getElementsByTagNameNS(W_NS, 'tcW')?.[0]?.getAttribute('w:w') || 'auto';
    const c1Span = c1?.node?.getElementsByTagNameNS(W_NS, 'gridSpan')?.[0]?.getAttribute('w:val') || '1';
    const c1Width = c1?.node?.getElementsByTagNameNS(W_NS, 'tcW')?.[0]?.getAttribute('w:w') || 'auto';
    console.log(`  Row ${idx} (cells: ${r.cells.length}): [C0 (span=${c0Span}, w=${c0Width}): "${c0Text}"] | [C1 (span=${c1Span}, w=${c1Width}): "${c1Text}"]`);
  });
}

run();
