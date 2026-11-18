import fs from 'node:fs/promises';

async function updateDocxEngine() {
  const file = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/docx-engine.js';
  let content = await fs.readFile(file, 'utf8');
  content = content.replace(/\r\n/g, '\n');

  const healFn = `/**
 * 全局表格拓扑自愈守卫 (Global Table Topology Guard)
 * 扫描全文档所有表格，自动纠正由于删列或收敛导致的行宽度缺损、跨列遗漏与悬空 vMerge
 */
export function healAllTableTopologies(docXml) {
  if (!docXml) return;
  const tbls = Array.from(docXml.getElementsByTagNameNS(W_NS, 'tbl'));
  for (const tbl of tbls) {
    const gridCols = Array.from(tbl.getElementsByTagNameNS(W_NS, 'gridCol'));
    if (gridCols.length === 0) continue;
    const gridWidths = gridCols.map((c) => Number(c.getAttributeNS(W_NS, 'w') || 0));
    const totalGridWidth = gridWidths.reduce((a, b) => a + b, 0);
    const totalGridCols = gridCols.length;

    const rows = Array.from(tbl.getElementsByTagNameNS(W_NS, 'tr'));
    for (let rIdx = 0; rIdx < rows.length; rIdx++) {
      const row = rows[rIdx];
      const cells = Array.from(row.getElementsByTagNameNS(W_NS, 'tc'));
      if (cells.length === 0) continue;

      let rowWidth = 0;
      let rowSpan = 0;
      for (const cell of cells) {
        const tcPr = cell.getElementsByTagNameNS(W_NS, 'tcPr')[0];
        const tcWNode = tcPr?.getElementsByTagNameNS(W_NS, 'tcW')[0];
        const spanNode = tcPr?.getElementsByTagNameNS(W_NS, 'gridSpan')[0];
        const wVal = Number(tcWNode?.getAttributeNS(W_NS, 'w') || 0);
        const sVal = Number(spanNode?.getAttributeNS(W_NS, 'val') || 1);
        rowWidth += wVal;
        rowSpan += sVal;
      }

      // 1. 自动自愈总宽度缺损与跨列不足
      if (rowWidth < totalGridWidth || rowSpan < totalGridCols) {
        const deficitWidth = totalGridWidth - rowWidth;
        const deficitSpan = totalGridCols - rowSpan;
        const lastCell = cells[cells.length - 1];
        if (lastCell) {
          let tcPr = lastCell.getElementsByTagNameNS(W_NS, 'tcPr')[0];
          if (!tcPr) {
            tcPr = docXml.createElementNS(W_NS, 'w:tcPr');
            lastCell.insertBefore(tcPr, lastCell.firstChild);
          }
          let tcW = tcPr.getElementsByTagNameNS(W_NS, 'tcW')[0];
          if (!tcW) {
            tcW = docXml.createElementNS(W_NS, 'w:tcW');
            tcPr.appendChild(tcW);
          }
          const curW = Number(tcW.getAttributeNS(W_NS, 'w') || 0);
          tcW.setAttributeNS(W_NS, 'w', String(curW + Math.max(0, deficitWidth)));
          tcW.setAttributeNS(W_NS, 'type', 'dxa');

          let gridSpan = tcPr.getElementsByTagNameNS(W_NS, 'gridSpan')[0];
          if (!gridSpan) {
            gridSpan = docXml.createElementNS(W_NS, 'w:gridSpan');
            tcPr.appendChild(gridSpan);
          }
          const curSpan = Number(gridSpan.getAttributeNS(W_NS, 'val') || 1);
          gridSpan.setAttributeNS(W_NS, 'val', String(curSpan + Math.max(0, deficitSpan)));
        }
      }

      // 2. 自动剥除孤立的纵向合并 (vMerge)
      for (let cIdx = 0; cIdx < cells.length; cIdx++) {
        const cell = cells[cIdx];
        const tcPr = cell.getElementsByTagNameNS(W_NS, 'tcPr')[0];
        const vMerge = tcPr?.getElementsByTagNameNS(W_NS, 'vMerge')[0];
        if (vMerge) {
          const val = vMerge.getAttributeNS(W_NS, 'val');
          if (val === 'restart') {
            const nextRow = rows[rIdx + 1];
            const nextCells = nextRow ? Array.from(nextRow.getElementsByTagNameNS(W_NS, 'tc')) : [];
            const nextCell = nextCells[cIdx];
            const nextTcPr = nextCell?.getElementsByTagNameNS(W_NS, 'tcPr')[0];
            const nextVMerge = nextTcPr?.getElementsByTagNameNS(W_NS, 'vMerge')[0];
            if (!nextVMerge || nextVMerge.getAttributeNS(W_NS, 'val') === 'restart') {
              tcPr.removeChild(vMerge);
            }
          }
        }
      }
    }
  }
}
`;

  // Insert healFn before export function normalizeRowGeometry
  content = content.replace(
    '/**\n * 表格行几何拓扑与跨列自愈中枢 (Table Row Geometry Normalizer)',
    healFn + '\n/**\n * 表格行几何拓扑与跨列自愈中枢 (Table Row Geometry Normalizer)'
  );

  // Hook healAllTableTopologies into exportArrayBuffer
  content = content.replace(
    'enableCrossPageBreaksForAllSections(this);',
    'enableCrossPageBreaksForAllSections(this);\n      healAllTableTopologies(this.documentXml);'
  );

  await fs.writeFile('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/scratch/docx-engine.proposed_healer.js', content, 'utf8');
  console.log('Prepared scratch/docx-engine.proposed_healer.js');
}
updateDocxEngine();
