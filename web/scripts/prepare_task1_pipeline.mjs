import fs from 'fs';

let code = fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/pipeline-engine.js', 'utf8');

// 1. cleanTabsInNode
const old1 = `function cleanTabsInNode(node, W_NS) {
  const tabs = Array.from(node.getElementsByTagNameNS(W_NS, 'tabs'));
  tabs.forEach(t => t.parentNode?.removeChild(t));
  const tabRuns = Array.from(node.getElementsByTagNameNS(W_NS, 'tab'));
  tabRuns.forEach(t => t.parentNode?.removeChild(t));
}`;
const new1 = `function cleanTabsInNode(node, W_NS) {
  const tabs = Array.from(node.getElementsByTagNameNS(W_NS, 'tabs'));
  tabs.forEach(t => t.parentNode?.removeChild(t));
  const tabRuns = Array.from(node.getElementsByTagNameNS(W_NS, 'tab'));
  tabRuns.forEach(t => t.parentNode?.removeChild(t));
  const numPrs = Array.from(node.getElementsByTagNameNS(W_NS, 'numPr'));
  numPrs.forEach(n => n.parentNode?.removeChild(n));
}`;
if (!code.includes(old1)) { console.error('old1 not found'); process.exit(1); }
code = code.replace(old1, new1);

// 2. applyHangingIndentToP
const old2 = `  const oldTabs = Array.from(pPr.getElementsByTagNameNS(W_NS, 'tabs'));
  oldTabs.forEach(t => pPr.removeChild(t));

  // 依据全局纯度门禁 (G-09 EN)，表格内零非法注入 <w:tabs>；仅下沉标准悬挂缩进几何`;
const new2 = `  const oldTabs = Array.from(pPr.getElementsByTagNameNS(W_NS, 'tabs'));
  oldTabs.forEach(t => pPr.removeChild(t));
  const numPrs = Array.from(pPr.getElementsByTagNameNS(W_NS, 'numPr'));
  numPrs.forEach(n => pPr.removeChild(n));

  // 依据全局纯度门禁 (G-09 EN)，表格内零非法注入 <w:tabs>；仅下沉标准悬挂缩进几何`;
if (!code.includes(old2)) { console.error('old2 not found'); process.exit(1); }
code = code.replace(old2, new2);

// 3. applyLeftIndentToP
const old3 = `  const ind = p.ownerDocument.createElementNS(W_NS, 'w:ind');
  ind.setAttributeNS(W_NS, 'w:left', left);
  pPr.appendChild(ind);

  const tabs = Array.from(pPr.getElementsByTagNameNS(W_NS, 'tabs'));
  tabs.forEach(t => pPr.removeChild(t));`;
const new3 = `  const numPrs = Array.from(pPr.getElementsByTagNameNS(W_NS, 'numPr'));
  numPrs.forEach(n => pPr.removeChild(n));

  const ind = p.ownerDocument.createElementNS(W_NS, 'w:ind');
  ind.setAttributeNS(W_NS, 'w:left', left);
  pPr.appendChild(ind);

  const tabs = Array.from(pPr.getElementsByTagNameNS(W_NS, 'tabs'));
  tabs.forEach(t => pPr.removeChild(t));`;
if (!code.includes(old3)) { console.error('old3 not found'); process.exit(1); }
code = code.replace(old3, new3);

// 4. rebuildUnifiedLabelRun
const old4 = `export function rebuildUnifiedLabelRun(p, seqStr, labelText, { font, asciiFont, sizeVal, bold }, W_NS) {
  const existingRuns = Array.from(p.getElementsByTagNameNS(W_NS, 'r'));
  existingRuns.forEach(r => p.removeChild(r));
  const doc = p.ownerDocument;`;
const new4 = `export function rebuildUnifiedLabelRun(p, seqStr, labelText, { font, asciiFont, sizeVal, bold }, W_NS) {
  const existingRuns = Array.from(p.getElementsByTagNameNS(W_NS, 'r'));
  existingRuns.forEach(r => p.removeChild(r));
  const numPrs = Array.from(p.getElementsByTagNameNS(W_NS, 'numPr'));
  numPrs.forEach(n => n.parentNode?.removeChild(n));
  const doc = p.ownerDocument;`;
if (!code.includes(old4)) { console.error('old4 not found'); process.exit(1); }
code = code.replace(old4, new4);

// 5. normalizeSection3Typography
const old5 = `export function normalizeSection3Typography(engine, isEnglish = false) {
  const W_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
  const s3 = engine.records.find(r => r.sectionNumber === 3);
  if (!s3 || !Array.isArray(s3.rows) || s3.rows.length < 3) return;`;
const new5 = `export function normalizeSection3Typography(engine, isEnglish = false) {
  const W_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
  const s3 = engine.records.find(r => r.sectionNumber === 3);
  if (!s3 || !Array.isArray(s3.rows) || s3.rows.length < 3) return;

  // 物理清除 Section 3 表格内残留的所有自动编号节点 (REQ-S3-DUP-PURGE)
  if (s3.node) {
    const s3NumPrs = Array.from(s3.node.getElementsByTagNameNS(W_NS, 'numPr'));
    s3NumPrs.forEach(n => n.parentNode?.removeChild(n));
  }`;
if (!code.includes(old5)) { console.error('old5 not found'); process.exit(1); }
code = code.replace(old5, new5);

fs.writeFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/scripts/pipeline_engine_proposed.js', code, 'utf8');
console.log('Successfully prepared pipeline_engine_proposed.js');
