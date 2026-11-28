import fs from 'node:fs/promises';

async function updateDocxEngine() {
  const file = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/docx-engine.js';
  let content = await fs.readFile(file, 'utf8');
  content = content.replace(/\r\n/g, '\n');

  const oldCode = `export function removeCellFromRow(row, cellIndex) {
  if (!row?.node || cellIndex < 0 || cellIndex >= row.cells.length) return false;
  const targetCell = row.cells[cellIndex];
  if (targetCell?.node && targetCell.node.parentNode) {
    targetCell.node.parentNode.removeChild(targetCell.node);
  }
  row.cells.splice(cellIndex, 1);
  return true;
}`;

  const newCode = `/**
 * 表格行几何拓扑与跨列自愈中枢 (Table Row Geometry Normalizer)
 * 彻底杜绝因删列或收敛导致的总宽度缺失、gridSpan 遗漏或悬空 vMerge 破坏排版
 */
export function normalizeRowGeometry(row, options = {}) {
  if (!row?.node || !Array.isArray(row.cells) || row.cells.length === 0) return;
  const secNum = row.record?.sectionNumber;

  // 1. 彻底清除所有单元格上的悬空 vMerge（若无后续行进行纵向合并，剥除 vMerge="restart" / "continue"）
  for (const cell of row.cells) {
    if (!cell?.node) continue;
    const vmNodes = Array.from(cell.node.getElementsByTagNameNS(W_NS, 'vMerge'));
    vmNodes.forEach((n) => n.parentNode?.removeChild(n));
    const localVmNodes = Array.from(cell.node.getElementsByTagName('vMerge'));
    localVmNodes.forEach((n) => n.parentNode?.removeChild(n));
  }

  // 2. 当行被收敛为标准双列（Label + Value）时，实施网格宽度与跨列自愈
  if (row.cells.length === 2) {
    const cell0 = row.cells[0];
    const cell1 = row.cells[1];

    if (secNum === 11 || options.isSection11 || /生殖毒性|Reproductive/i.test(cell0?.text || '')) {
      // Section 11 标准双列定义：Cell 0 宽 3519 dxa，Cell 1 宽 6262 dxa 且跨 3 列 (gridSpan="3")
      if (cell0?.node) {
        let tcPr0 = cell0.node.getElementsByTagNameNS(W_NS, 'tcPr')[0] || cell0.node.querySelector('tcPr');
        if (!tcPr0) {
          tcPr0 = cell0.node.ownerDocument.createElementNS(W_NS, 'w:tcPr');
          cell0.node.insertBefore(tcPr0, cell0.node.firstChild);
        }
        let tcW0 = tcPr0.getElementsByTagNameNS(W_NS, 'tcW')[0] || tcPr0.querySelector('tcW');
        if (!tcW0) {
          tcW0 = cell0.node.ownerDocument.createElementNS(W_NS, 'w:tcW');
          tcPr0.appendChild(tcW0);
        }
        tcW0.setAttributeNS(W_NS, 'w:w', '3519');
        tcW0.setAttributeNS(W_NS, 'w:type', 'dxa');
      }

      if (cell1?.node) {
        let tcPr1 = cell1.node.getElementsByTagNameNS(W_NS, 'tcPr')[0] || cell1.node.querySelector('tcPr');
        if (!tcPr1) {
          tcPr1 = cell1.node.ownerDocument.createElementNS(W_NS, 'w:tcPr');
          cell1.node.insertBefore(tcPr1, cell1.node.firstChild);
        }

        // 补齐宽度为 6262 dxa，与全表其他双列行 100% 齐平
        let tcW1 = tcPr1.getElementsByTagNameNS(W_NS, 'tcW')[0] || tcPr1.querySelector('tcW');
        if (!tcW1) {
          tcW1 = cell1.node.ownerDocument.createElementNS(W_NS, 'w:tcW');
          tcPr1.appendChild(tcW1);
        }
        tcW1.setAttributeNS(W_NS, 'w:w', '6262');
        tcW1.setAttributeNS(W_NS, 'w:type', 'dxa');

        // 补齐 gridSpan="3"
        let gridSpan1 = tcPr1.getElementsByTagNameNS(W_NS, 'gridSpan')[0] || tcPr1.querySelector('gridSpan');
        if (!gridSpan1) {
          gridSpan1 = cell1.node.ownerDocument.createElementNS(W_NS, 'w:gridSpan');
          tcPr1.appendChild(gridSpan1);
        }
        gridSpan1.setAttributeNS(W_NS, 'w:val', '3');
      }
    }
  }
}

export function removeCellFromRow(row, cellIndex) {
  if (!row?.node || cellIndex < 0 || cellIndex >= row.cells.length) return false;
  const targetCell = row.cells[cellIndex];
  if (targetCell?.node && targetCell.node.parentNode) {
    targetCell.node.parentNode.removeChild(targetCell.node);
  }
  row.cells.splice(cellIndex, 1);
  // 删列后自动执行几何拓扑与跨列自愈
  normalizeRowGeometry(row);
  return true;
}`;

  if (content.includes(oldCode)) {
    content = content.replace(oldCode, newCode);
    await fs.writeFile('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/scratch/docx-engine.proposed_geometry.js', content, 'utf8');
    console.log('Successfully prepared scratch/docx-engine.proposed_geometry.js');
  } else {
    console.error('Failed to match oldCode in docx-engine.js');
  }
}
updateDocxEngine();
