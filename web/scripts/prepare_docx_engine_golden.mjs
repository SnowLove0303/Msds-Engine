import fs from 'fs';

let code = fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/docx-engine.js', 'utf8');

// Replace formatSection11LabelCell
const oldS11 = `export function formatSection11LabelCell(cell, numberStr, labelText, isEnglish = false) {
  if (!cell?.node) return;
  applyStandardHangingIndent(cell, '565', '565');
  const ps = Array.from(cell.node.getElementsByTagNameNS(W_NS, 'p'));
  if (ps.length === 0) return;
  const p = ps[0];
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

  const fullText = \`\${numberStr}  \${cleanLabel}\`;

  const r = p.ownerDocument.createElementNS(W_NS, 'w:r');
  const rPr = p.ownerDocument.createElementNS(W_NS, 'w:rPr');
  const rFonts = p.ownerDocument.createElementNS(W_NS, 'w:rFonts');
  rFonts.setAttributeNS(W_NS, 'w:ascii', isEnglish ? 'Arial' : 'Times New Roman');
  rFonts.setAttributeNS(W_NS, 'w:hAnsi', isEnglish ? 'Arial' : 'Times New Roman');
  rFonts.setAttributeNS(W_NS, 'w:eastAsia', isEnglish ? 'Arial' : '宋体');
  rFonts.setAttributeNS(W_NS, 'w:cs', isEnglish ? 'Arial' : 'Times New Roman');
  rPr.appendChild(rFonts);

  const b = p.ownerDocument.createElementNS(W_NS, 'w:b');
  const bCs = p.ownerDocument.createElementNS(W_NS, 'w:bCs');
  rPr.appendChild(b);
  rPr.appendChild(bCs);

  const szVal = isEnglish ? '19' : '24';
  const sz = p.ownerDocument.createElementNS(W_NS, 'w:sz');
  sz.setAttributeNS(W_NS, 'w:val', szVal);
  const szCs = p.ownerDocument.createElementNS(W_NS, 'w:szCs');
  szCs.setAttributeNS(W_NS, 'w:val', szVal);
  rPr.appendChild(sz);
  rPr.appendChild(szCs);

  r.appendChild(rPr);
  const t = p.ownerDocument.createElementNS(W_NS, 'w:t');
  t.textContent = fullText;
  r.appendChild(t);
  p.appendChild(r);
}`;

const newS11 = `export function formatSection11LabelCell(cell, numberStr, labelText, isEnglish = false) {
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
}`;

if (!code.includes(oldS11)) {
  console.error('oldS11 not found in docx-engine.js');
  process.exit(1);
}
code = code.replace(oldS11, newS11);

// Replace formatSection14LabelCell
const oldS14 = `export function formatSection14LabelCell(cell, numberStr, labelText, isEnglish = false) {
  if (!cell?.node) return;
  const ps = Array.from(cell.node.getElementsByTagNameNS(W_NS, 'p'));
  if (ps.length === 0) return;
  const p = ps[0];
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

  const fullText = \`\${numberStr}  \${cleanLabel}\`;

  const r = p.ownerDocument.createElementNS(W_NS, 'w:r');
  const rPr = p.ownerDocument.createElementNS(W_NS, 'w:rPr');
  const rFonts = p.ownerDocument.createElementNS(W_NS, 'w:rFonts');
  rFonts.setAttributeNS(W_NS, 'w:ascii', isEnglish ? 'Arial' : 'Times New Roman');
  rFonts.setAttributeNS(W_NS, 'w:hAnsi', isEnglish ? 'Arial' : 'Times New Roman');
  rFonts.setAttributeNS(W_NS, 'w:eastAsia', isEnglish ? 'Arial' : '宋体');
  rFonts.setAttributeNS(W_NS, 'w:cs', isEnglish ? 'Arial' : 'Times New Roman');
  rPr.appendChild(rFonts);

  const b = p.ownerDocument.createElementNS(W_NS, 'w:b');
  const bCs = p.ownerDocument.createElementNS(W_NS, 'w:bCs');
  rPr.appendChild(b);
  rPr.appendChild(bCs);

  const szVal = isEnglish ? '19' : '24';
  const sz = p.ownerDocument.createElementNS(W_NS, 'w:sz');
  sz.setAttributeNS(W_NS, 'w:val', szVal);
  const szCs = p.ownerDocument.createElementNS(W_NS, 'w:szCs');
  szCs.setAttributeNS(W_NS, 'w:val', szVal);
  rPr.appendChild(sz);
  rPr.appendChild(szCs);

  r.appendChild(rPr);
  const t = p.ownerDocument.createElementNS(W_NS, 'w:t');
  t.textContent = fullText;
  r.appendChild(t);
  p.appendChild(r);
}`;

const newS14 = `export function formatSection14LabelCell(cell, numberStr, labelText, isEnglish = false) {
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
}`;

if (!code.includes(oldS14)) {
  console.error('oldS14 not found in docx-engine.js');
  process.exit(1);
}
code = code.replace(oldS14, newS14);

fs.writeFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/scripts/docx_engine_proposed2.js', code, 'utf8');
console.log('docx_engine_proposed2.js prepared successfully!');
