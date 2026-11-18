import fs from 'fs';

const filePath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/docx-engine.js';
let code = fs.readFileSync(filePath, 'utf8');

// Find target section
const startTarget = '/**\n * 格式化 Section 11 标签单元格 (法定悬挂缩进 565/565、字号、加粗)\n */';
const endTarget = '/**\n * 从源文件中 1:1 物理提取所有毒理学终点 (自适应多行表格与叙述性通栏单单元格)\n */';

const sIdx = code.indexOf(startTarget);
const eIdx = code.indexOf(endTarget);

if (sIdx === -1 || eIdx === -1) {
  console.error('Target not found!', { sIdx, eIdx });
  process.exit(1);
}

const replacement = `/**
 * 格式化 Section 11 标签单元格 (统一 9.1 外观黄金基准 420/420、激光垂直对齐、字号、加粗)
 */
export function formatSection11LabelCell(cell, numberStr, labelText, isEnglish = false) {
  if (!cell?.node) return;
  // 9.1 外观黄金几何标尺：420 dxa 悬挂缩进 + <w:tab/> 激光垂直对齐 (REQ-GOLDEN-ANCHOR)
  applyStandardHangingIndent(cell, '420', '420');
  const ps = Array.from(cell.node.getElementsByTagNameNS(W_NS, 'p'));
  if (ps.length === 0) return;
  const p = ps[0];
  const pNumPrs = Array.from(p.getElementsByTagNameNS(W_NS, 'numPr'));
  pNumPrs.forEach(n => n.parentNode?.removeChild(n));
  for (let i = 1; i < ps.length; i++) {
    ps[i].parentNode?.removeChild(ps[i]);
  }
  Array.from(p.getElementsByTagNameNS(W_NS, 'r')).forEach(r => p.removeChild(r));

  let cleanLabel = labelText.trim();
  if (isEnglish) {
    cleanLabel = cleanLabel.replace(/：/g, ':');
    if (!cleanLabel.endsWith(':')) cleanLabel += ':';
  } else {
    cleanLabel = cleanLabel.replace(/:/g, '：');
    if (!cleanLabel.endsWith('：')) cleanLabel += '：';
  }

  // Run 1: 序号 Run + <w:tab/>
  const r1 = p.ownerDocument.createElementNS(W_NS, 'w:r');
  const rPr1 = p.ownerDocument.createElementNS(W_NS, 'w:rPr');
  const rFonts1 = p.ownerDocument.createElementNS(W_NS, 'w:rFonts');
  rFonts1.setAttributeNS(W_NS, 'w:ascii', isEnglish ? 'Arial' : 'Times New Roman');
  rFonts1.setAttributeNS(W_NS, 'w:hAnsi', isEnglish ? 'Arial' : 'Times New Roman');
  rFonts1.setAttributeNS(W_NS, 'w:eastAsia', isEnglish ? 'Arial' : '宋体');
  rFonts1.setAttributeNS(W_NS, 'w:cs', isEnglish ? 'Arial' : 'Times New Roman');
  rPr1.appendChild(rFonts1);
  const b1 = p.ownerDocument.createElementNS(W_NS, 'w:b');
  rPr1.appendChild(b1);
  const seqSz = !isEnglish ? (numberStr.length >= 5 ? '20' : '21') : (numberStr.length >= 5 ? '18' : '19');
  const sz1 = p.ownerDocument.createElementNS(W_NS, 'w:sz');
  sz1.setAttributeNS(W_NS, 'w:val', seqSz);
  rPr1.appendChild(sz1);
  const szCs1 = p.ownerDocument.createElementNS(W_NS, 'w:szCs');
  szCs1.setAttributeNS(W_NS, 'w:val', seqSz);
  rPr1.appendChild(szCs1);
  r1.appendChild(rPr1);

  const t1 = p.ownerDocument.createElementNS(W_NS, 'w:t');
  t1.textContent = numberStr;
  r1.appendChild(t1);
  const tab = p.ownerDocument.createElementNS(W_NS, 'w:tab');
  r1.appendChild(tab);
  p.appendChild(r1);

  // Run 2: 标签 Run
  const r2 = p.ownerDocument.createElementNS(W_NS, 'w:r');
  const rPr2 = p.ownerDocument.createElementNS(W_NS, 'w:rPr');
  const rFonts2 = p.ownerDocument.createElementNS(W_NS, 'w:rFonts');
  rFonts2.setAttributeNS(W_NS, 'w:ascii', isEnglish ? 'Arial' : 'Times New Roman');
  rFonts2.setAttributeNS(W_NS, 'w:hAnsi', isEnglish ? 'Arial' : 'Times New Roman');
  rFonts2.setAttributeNS(W_NS, 'w:eastAsia', isEnglish ? 'Arial' : '宋体');
  rFonts2.setAttributeNS(W_NS, 'w:cs', isEnglish ? 'Arial' : 'Times New Roman');
  rPr2.appendChild(rFonts2);
  const b2 = p.ownerDocument.createElementNS(W_NS, 'w:b');
  rPr2.appendChild(b2);
  const targetLblSz = isEnglish ? '19' : '24';
  const sz2 = p.ownerDocument.createElementNS(W_NS, 'w:sz');
  sz2.setAttributeNS(W_NS, 'w:val', targetLblSz);
  rPr2.appendChild(sz2);
  const szCs2 = p.ownerDocument.createElementNS(W_NS, 'w:szCs');
  szCs2.setAttributeNS(W_NS, 'w:val', targetLblSz);
  rPr2.appendChild(szCs2);
  r2.appendChild(rPr2);

  const t2 = p.ownerDocument.createElementNS(W_NS, 'w:t');
  t2.textContent = cleanLabel;
  r2.appendChild(t2);
  p.appendChild(r2);
}

/**
 * 格式化 Section 14 标签单元格 (统一 9.1 外观黄金基准 420/420、加粗、法定字号)
 */
export function formatSection14LabelCell(cell, numberStr, labelText, isEnglish = false) {
  if (!cell?.node) return;
  // 9.1 外观黄金几何标尺：420 dxa 悬挂缩进 + <w:tab/> 激光垂直对齐 (REQ-GOLDEN-ANCHOR)
  applyStandardHangingIndent(cell, '420', '420');
  const ps = Array.from(cell.node.getElementsByTagNameNS(W_NS, 'p'));
  if (ps.length === 0) return;
  const p = ps[0];
  const pNumPrs = Array.from(p.getElementsByTagNameNS(W_NS, 'numPr'));
  pNumPrs.forEach(n => n.parentNode?.removeChild(n));
  for (let i = 1; i < ps.length; i++) {
    ps[i].parentNode?.removeChild(ps[i]);
  }
  Array.from(p.getElementsByTagNameNS(W_NS, 'r')).forEach(r => p.removeChild(r));

  let cleanLabel = labelText.trim();
  if (isEnglish) {
    cleanLabel = cleanLabel.replace(/：/g, ':');
    if (!cleanLabel.endsWith(':')) cleanLabel += ':';
  } else {
    cleanLabel = cleanLabel.replace(/:/g, '：');
    if (!cleanLabel.endsWith('：')) cleanLabel += '：';
  }

  // Run 1: 序号 Run + <w:tab/>
  const r1 = p.ownerDocument.createElementNS(W_NS, 'w:r');
  const rPr1 = p.ownerDocument.createElementNS(W_NS, 'w:rPr');
  const rFonts1 = p.ownerDocument.createElementNS(W_NS, 'w:rFonts');
  rFonts1.setAttributeNS(W_NS, 'w:ascii', isEnglish ? 'Arial' : 'Times New Roman');
  rFonts1.setAttributeNS(W_NS, 'w:hAnsi', isEnglish ? 'Arial' : 'Times New Roman');
  rFonts1.setAttributeNS(W_NS, 'w:eastAsia', isEnglish ? 'Arial' : '宋体');
  rFonts1.setAttributeNS(W_NS, 'w:cs', isEnglish ? 'Arial' : 'Times New Roman');
  rPr1.appendChild(rFonts1);
  const b1 = p.ownerDocument.createElementNS(W_NS, 'w:b');
  rPr1.appendChild(b1);
  const seqSz = !isEnglish ? (numberStr.length >= 5 ? '20' : '21') : (numberStr.length >= 5 ? '18' : '19');
  const sz1 = p.ownerDocument.createElementNS(W_NS, 'w:sz');
  sz1.setAttributeNS(W_NS, 'w:val', seqSz);
  rPr1.appendChild(sz1);
  const szCs1 = p.ownerDocument.createElementNS(W_NS, 'w:szCs');
  szCs1.setAttributeNS(W_NS, 'w:val', seqSz);
  rPr1.appendChild(szCs1);
  r1.appendChild(rPr1);

  const t1 = p.ownerDocument.createElementNS(W_NS, 'w:t');
  t1.textContent = numberStr;
  r1.appendChild(t1);
  const tab = p.ownerDocument.createElementNS(W_NS, 'w:tab');
  r1.appendChild(tab);
  p.appendChild(r1);

  // Run 2: 标签 Run
  const r2 = p.ownerDocument.createElementNS(W_NS, 'w:r');
  const rPr2 = p.ownerDocument.createElementNS(W_NS, 'w:rPr');
  const rFonts2 = p.ownerDocument.createElementNS(W_NS, 'w:rFonts');
  rFonts2.setAttributeNS(W_NS, 'w:ascii', isEnglish ? 'Arial' : 'Times New Roman');
  rFonts2.setAttributeNS(W_NS, 'w:hAnsi', isEnglish ? 'Arial' : 'Times New Roman');
  rFonts2.setAttributeNS(W_NS, 'w:eastAsia', isEnglish ? 'Arial' : '宋体');
  rFonts2.setAttributeNS(W_NS, 'w:cs', isEnglish ? 'Arial' : 'Times New Roman');
  rPr2.appendChild(rFonts2);
  const b2 = p.ownerDocument.createElementNS(W_NS, 'w:b');
  rPr2.appendChild(b2);
  const targetLblSz = isEnglish ? '19' : '24';
  const sz2 = p.ownerDocument.createElementNS(W_NS, 'w:sz');
  sz2.setAttributeNS(W_NS, 'w:val', targetLblSz);
  rPr2.appendChild(sz2);
  const szCs2 = p.ownerDocument.createElementNS(W_NS, 'w:szCs');
  szCs2.setAttributeNS(W_NS, 'w:val', targetLblSz);
  rPr2.appendChild(szCs2);
  r2.appendChild(rPr2);

  const t2 = p.ownerDocument.createElementNS(W_NS, 'w:t');
  t2.textContent = cleanLabel;
  r2.appendChild(t2);
  p.appendChild(r2);
}

`;

const newCode = code.substring(0, sIdx) + replacement + code.substring(eIdx);
fs.writeFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/scripts/docx_engine_proposed_golden.js', newCode, 'utf8');
console.log('Successfully generated docx_engine_proposed_golden.js!');
