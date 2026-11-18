import fs from 'fs';

let content = fs.readFileSync('./web/src/docx-engine.js', 'utf8');
const isCrlf = content.includes('\r\n');
if (isCrlf) content = content.replace(/\r\n/g, '\n');

// 1. replaceSequence
const targetReplaceSeq = `function replaceSequence(cell, sectionNumber, itemNumber) {
  if (!cell) return false;
  const full = combinedNodeText(cell.paragraphs.flatMap((paragraph) => paragraph.runs.flatMap((run) => run.textNodes)));
  const match = sequenceMatch(full);
  if (!match || Number(match[2]) !== Number(sectionNumber)) return false;
  const separator = ' '.repeat(Math.max(1, 5 - \`\${sectionNumber}.\${itemNumber}\`.length));
  const replacement = \`\${match[1]}\${sectionNumber}.\${itemNumber}\${sectionNumber === 9 ? separator : (match[4] || '  ')}\${match[5]}\`;
  distributeText(cell.paragraphs.flatMap((paragraph) => paragraph.runs.flatMap((run) => run.textNodes)), replacement);
  refreshCellText(cell);
  return true;
}`;

const newReplaceSeq = `function replaceSequence(cell, sectionNumber, itemNumber) {
  if (!cell) return false;
  const full = combinedNodeText(cell.paragraphs.flatMap((paragraph) => paragraph.runs.flatMap((run) => run.textNodes)));
  const match = sequenceMatch(full);
  if (!match || Number(match[2]) !== Number(sectionNumber)) return false;
  const secNum = Number(sectionNumber);
  const padLen = secNum === 11 ? 6 : (secNum === 9 ? 5 : 5);
  const itemStr = \`\${sectionNumber}.\${itemNumber}\`;
  const spaceCount = (secNum === 11 && itemNumber === 10) ? 2 : Math.max(1, padLen - itemStr.length);
  const separator = ' '.repeat(spaceCount);
  const replacement = \`\${match[1]}\${sectionNumber}.\${itemNumber}\${secNum === 9 || secNum === 11 ? separator : (match[4] || '  ')}\${match[5]}\`;
  distributeText(cell.paragraphs.flatMap((paragraph) => paragraph.runs.flatMap((run) => run.textNodes)), replacement);
  refreshCellText(cell);
  return true;
}`;

if (!content.includes(targetReplaceSeq)) {
  console.log('targetReplaceSeq not found!');
  process.exit(1);
}

content = content.replace(targetReplaceSeq, newReplaceSeq);

// 2. Add removeCellFromRow & formatSection9LabelCell & update renumberRecord
const targetRenumber = `export function renumberRecord(record) {
  const section = record?.sectionNumber;
  if (!section || record.kind !== 'table') return [];
  let next = 0;
  const seenNodes = new Set();
  const changes = [];
  for (const row of record.rows.slice(1)) {
    const cell = row.cells[0];
    if (!cell) continue;
    if (cell.node && seenNodes.has(cell.node)) continue;
    if (cell.node) seenNodes.add(cell.node);
    const match = sequenceMatch(cell.text);
    if (!match || Number(match[2]) !== section) continue;
    const rest = match[5].trim();
    if (!rest || /^[+\\-<>=~\\d]/.test(rest)) continue;
    const oldItem = Number(match[3]);
    const item = ++next;
    if (oldItem !== item) {
      changes.push({ row: row.index, from: \`\${section}.\${oldItem}\`, to: \`\${section}.\${item}\` });
      replaceSequence(cell, section, item);
    }
  }
  return changes;
}`;

const newRenumber = `export function removeCellFromRow(row, cellIndex) {
  if (!row?.node || cellIndex < 0 || cellIndex >= row.cells.length) return false;
  const targetCell = row.cells[cellIndex];
  if (targetCell?.node && targetCell.node.parentNode) {
    targetCell.node.parentNode.removeChild(targetCell.node);
  }
  row.cells.splice(cellIndex, 1);
  return true;
}

export function formatSection9LabelCell(cell, numberStr, labelText, isEnglish = false) {
  if (!cell?.node) return;
  applyStandardHangingIndent(cell, '457', '457', '459');
  const p = cell.node.getElementsByTagNameNS(W_NS, 'p')[0] || cell.node.querySelector('p');
  if (!p) return;
  const existingRuns = Array.from(p.getElementsByTagNameNS(W_NS, 'r'));
  existingRuns.forEach(r => p.removeChild(r));
  const localRuns = Array.from(p.getElementsByTagName('r'));
  localRuns.forEach(r => p.removeChild(r));

  const r1 = p.ownerDocument.createElementNS(W_NS, 'w:r');
  const rPr1 = p.ownerDocument.createElementNS(W_NS, 'w:rPr');
  const rFonts1 = p.ownerDocument.createElementNS(W_NS, 'w:rFonts');
  rFonts1.setAttributeNS(W_NS, 'w:hint', 'eastAsia');
  rFonts1.setAttributeNS(W_NS, 'w:ascii', 'Times New Roman');
  rFonts1.setAttributeNS(W_NS, 'w:hAnsi', 'Times New Roman');
  rFonts1.setAttributeNS(W_NS, 'w:eastAsia', '宋体');
  rFonts1.setAttributeNS(W_NS, 'w:cs', 'Times New Roman');
  rPr1.appendChild(rFonts1);
  const b1 = p.ownerDocument.createElementNS(W_NS, 'w:b');
  rPr1.appendChild(b1);
  const sz1 = p.ownerDocument.createElementNS(W_NS, 'w:sz');
  sz1.setAttributeNS(W_NS, 'w:val', '21');
  rPr1.appendChild(sz1);
  const szCs1 = p.ownerDocument.createElementNS(W_NS, 'w:szCs');
  szCs1.setAttributeNS(W_NS, 'w:val', '21');
  rPr1.appendChild(szCs1);
  r1.appendChild(rPr1);
  const t1 = p.ownerDocument.createElementNS(W_NS, 'w:t');
  t1.setAttribute('xml:space', 'preserve');
  t1.textContent = \`\${numberStr}  \`;
  r1.appendChild(t1);
  p.appendChild(r1);

  const r2 = p.ownerDocument.createElementNS(W_NS, 'w:r');
  const rPr2 = p.ownerDocument.createElementNS(W_NS, 'w:rPr');
  const rFonts2 = p.ownerDocument.createElementNS(W_NS, 'w:rFonts');
  rFonts2.setAttributeNS(W_NS, 'w:hint', 'eastAsia');
  rFonts2.setAttributeNS(W_NS, 'w:hAnsi', isEnglish ? 'Arial' : '黑体');
  rFonts2.setAttributeNS(W_NS, 'w:ascii', isEnglish ? 'Arial' : '黑体');
  rFonts2.setAttributeNS(W_NS, 'w:eastAsia', isEnglish ? 'Arial' : '黑体');
  rPr2.appendChild(rFonts2);
  const b2 = p.ownerDocument.createElementNS(W_NS, 'w:b');
  rPr2.appendChild(b2);
  const sz2 = p.ownerDocument.createElementNS(W_NS, 'w:sz');
  sz2.setAttributeNS(W_NS, 'w:val', '24');
  rPr2.appendChild(sz2);
  const szCs2 = p.ownerDocument.createElementNS(W_NS, 'w:szCs');
  szCs2.setAttributeNS(W_NS, 'w:val', '24');
  rPr2.appendChild(szCs2);
  r2.appendChild(rPr2);
  const t2 = p.ownerDocument.createElementNS(W_NS, 'w:t');
  t2.textContent = labelText;
  r2.appendChild(t2);
  p.appendChild(r2);

  refreshCellText(cell);
}

export function renumberRecord(record) {
  const section = record?.sectionNumber;
  if (!section || record.kind !== 'table') return [];
  let next = 0;
  const seenNodes = new Set();
  const changes = [];
  for (const row of record.rows.slice(1)) {
    const cell = row.cells[0];
    if (!cell) continue;
    if (cell.node && seenNodes.has(cell.node)) continue;
    if (cell.node) seenNodes.add(cell.node);
    const match = sequenceMatch(cell.text);
    if (!match || Number(match[2]) !== section) continue;
    const rest = match[5].trim();
    if (!rest || /^[+\\-<>=~\\d]/.test(rest)) continue;
    const oldItem = Number(match[3]);
    const item = ++next;
    if (section === 9) {
      const isEnglish = /Appearance/i.test(cell.text) || /Physical/i.test(record.rows[0]?.cells?.[0]?.text || '');
      formatSection9LabelCell(cell, \`\${section}.\${item}\`, rest, isEnglish);
      if (oldItem !== item) {
        changes.push({ row: row.index, from: \`\${section}.\${oldItem}\`, to: \`\${section}.\${item}\` });
      }
    } else {
      if (oldItem !== item) {
        changes.push({ row: row.index, from: \`\${section}.\${oldItem}\`, to: \`\${section}.\${item}\` });
        replaceSequence(cell, section, item);
      }
    }
  }
  return changes;
}`;

if (!content.includes(targetRenumber)) {
  console.log('targetRenumber not found!');
  process.exit(1);
}

content = content.replace(targetRenumber, newRenumber);
if (isCrlf) content = content.replace(/\n/g, '\r\n');

fs.writeFileSync('./scratch/docx-engine.proposed.js', content, 'utf8');
console.log('Successfully created ./scratch/docx-engine.proposed.js');
