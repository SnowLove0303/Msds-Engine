import { W_NS, DocxEngineError } from './docx-engine.js';

// @ANTIGRAVITY_INVARIANT_LOCK_START: MSDS_UNIVERSAL_DESIGN_TOKENS_IMMUTABLE
/**
 * MSDS 全文档工业级设计令牌单一真理源 (Single Source of Truth)
 * 彻底隔离内容与排版。上层业务代码只允许写入纯文本事实，严禁在局部私自指定或篡改字阶与字体！
 */
export const MSDS_DESIGN_TOKENS = Object.freeze({
  CN: Object.freeze({
    SECTION_HEADER: Object.freeze({ font: '宋体', sz: '24', sizePt: 12, bold: true }),
    LABEL_BOLD: Object.freeze({ font: '宋体', sz: '24', sizePt: 12, bold: true }),
    LABEL_SEQ: Object.freeze({ font: 'Times New Roman', sz: '24', sizePt: 12, bold: true }),
    TABLE_VALUE: Object.freeze({ font: '宋体', sz: '24', sizePt: 12, bold: false }), // 全局 16 章节值格恒为小四号 12pt 宋体常规体
    TABLE_HEADER: Object.freeze({ font: '宋体', sz: '24', sizePt: 12, bold: true }),
    PREAMBLE: Object.freeze({ font: '宋体', sz: '24', sizePt: 12, bold: false }),
  }),
  EN: Object.freeze({
    SECTION_HEADER: Object.freeze({ font: 'Arial', sz: '22', sizePt: 11, bold: true }),
    LABEL_BOLD: Object.freeze({ font: 'Arial', sz: '19', sizePt: 9.5, bold: true }),
    LABEL_SEQ: Object.freeze({ font: 'Arial', sz: '19', sizePt: 9.5, bold: true }),
    TABLE_VALUE: Object.freeze({ font: 'Arial', sz: '19', sizePt: 9.5, bold: false }), // 全局 16 章节值格恒为五号 9.5pt Arial 常规体
    TABLE_HEADER: Object.freeze({ font: 'Arial', sz: '19', sizePt: 9.5, bold: true }),
    PREAMBLE: Object.freeze({ font: 'Arial', sz: '19', sizePt: 9.5, bold: false }),
  })
});
// @ANTIGRAVITY_INVARIANT_LOCK_END

/**
 * 从表格中物理删除指定列，并重新平衡分配网格列宽
 */
export function deleteTableColumn(engine, record, colIndex) {
  if (!record || record.kind !== 'table') throw new DocxEngineError('当前记录不是表格', 'NOT_TABLE');
  const tblNode = record.tableNode || record.node || record.rows?.[0]?.node?.parentNode;
  if (!tblNode) throw new DocxEngineError('未找到表格 DOM 节点', 'NODE_NOT_FOUND');

  const gridNode = tblNode.getElementsByTagNameNS(W_NS, 'tblGrid')?.[0];
  let deletedWidthTwips = 0;

  // 1. 从 tblGrid 中删除该列并记录列宽
  if (gridNode) {
    const gridCols = Array.from(gridNode.getElementsByTagNameNS(W_NS, 'gridCol'));
    if (colIndex < 0 || colIndex >= gridCols.length) {
      throw new DocxEngineError(`列索引越界: 目标索引 ${colIndex} 超出表格总列数 ${gridCols.length}`, 'INDEX_OUT_OF_BOUNDS');
    }
    const colToRemove = gridCols[colIndex];
    const wVal = colToRemove.getAttributeNS(W_NS, 'w') || colToRemove.getAttribute('w:w');
    deletedWidthTwips = Number(wVal) || 0;
    gridNode.removeChild(colToRemove);
  }

  // 2. 遍历表格的每一行，定位并移除对应的单元格
  const trNodes = Array.from(tblNode.getElementsByTagNameNS(W_NS, 'tr'));
  for (const tr of trNodes) {
    const tcNodes = Array.from(tr.getElementsByTagNameNS(W_NS, 'tc'));
    let currentGridCol = 0;
    let targetTc = null;

    for (const tc of tcNodes) {
      const tcPr = tc.getElementsByTagNameNS(W_NS, 'tcPr')?.[0];
      const gsNode = tcPr?.getElementsByTagNameNS(W_NS, 'gridSpan')?.[0];
      const gridSpan = Number(gsNode?.getAttributeNS(W_NS, 'val') || gsNode?.getAttribute('w:val') || 1);

      if (currentGridCol === colIndex) {
        targetTc = tc;
        break;
      }
      currentGridCol += gridSpan;
    }

    if (targetTc) {
      tr.removeChild(targetTc);
    } else if (tcNodes.length > colIndex) {
      tr.removeChild(tcNodes[colIndex]);
    }

    // 宽度补偿给行内剩余的最后一个单元格，保持行总宽守恒
    if (deletedWidthTwips > 0) {
      const remainingTcs = Array.from(tr.getElementsByTagNameNS(W_NS, 'tc'));
      if (remainingTcs.length > 0) {
        const lastTc = remainingTcs[remainingTcs.length - 1];
        const lastTcPr = lastTc.getElementsByTagNameNS(W_NS, 'tcPr')?.[0];
        const lastTcW = lastTcPr?.getElementsByTagNameNS(W_NS, 'tcW')?.[0];
        if (lastTcW) {
          const oldW = Number(lastTcW.getAttributeNS(W_NS, 'w') || lastTcW.getAttribute('w:w') || 0);
          lastTcW.setAttributeNS(W_NS, 'w:w', String(oldW + deletedWidthTwips));
        }
      }
    }
  }

  if (engine?.refresh) {
    engine.refresh();
  }
  return { success: true, deletedWidthTwips };
}

/**
 * 将指定行内的连续单元格横向合并
 */
export function mergeRowCells(engine, record, rowIndex, colStart = 0, colSpan = 2) {
  if (!record || record.kind !== 'table') throw new DocxEngineError('当前记录不是表格', 'NOT_TABLE');
  const tblNode = record.tableNode || record.node || record.rows?.[0]?.node?.parentNode;
  if (!tblNode) throw new DocxEngineError('未找到表格 DOM 节点', 'NODE_NOT_FOUND');

  const trNodes = Array.from(tblNode.getElementsByTagNameNS(W_NS, 'tr'));
  if (rowIndex < 0 || rowIndex >= trNodes.length) {
    throw new DocxEngineError(`行索引越界: ${rowIndex}`, 'ROW_OUT_OF_BOUNDS');
  }

  const tr = trNodes[rowIndex];
  const tcNodes = Array.from(tr.getElementsByTagNameNS(W_NS, 'tc'));
  if (colStart >= tcNodes.length) {
    throw new DocxEngineError(`合并起始列越界: ${colStart}`, 'COL_OUT_OF_BOUNDS');
  }

  const baseTc = tcNodes[colStart];
  let combinedWidth = 0;
  const combinedTexts = [];

  const actualSpan = Math.min(colSpan, tcNodes.length - colStart);
  for (let i = 0; i < actualSpan; i++) {
    const tc = tcNodes[colStart + i];
    const tcPr = tc.getElementsByTagNameNS(W_NS, 'tcPr')?.[0];
    const tcW = tcPr?.getElementsByTagNameNS(W_NS, 'tcW')?.[0];
    const wVal = Number(tcW?.getAttributeNS(W_NS, 'w') || tcW?.getAttribute('w:w') || 0);
    combinedWidth += wVal;

    const paras = Array.from(tc.getElementsByTagNameNS(W_NS, 'p'));
    const text = paras.map(p => p.textContent.trim()).filter(Boolean).join(' ');
    if (text) combinedTexts.push(text);

    if (i > 0) {
      tr.removeChild(tc);
    }
  }

  let baseTcPr = baseTc.getElementsByTagNameNS(W_NS, 'tcPr')?.[0];
  if (!baseTcPr) {
    baseTcPr = tblNode.ownerDocument.createElementNS(W_NS, 'w:tcPr');
    baseTc.insertBefore(baseTcPr, baseTc.firstChild);
  }

  // 设置合并后 gridSpan
  let gsNode = baseTcPr.getElementsByTagNameNS(W_NS, 'gridSpan')?.[0];
  if (!gsNode) {
    gsNode = tblNode.ownerDocument.createElementNS(W_NS, 'w:gridSpan');
    baseTcPr.appendChild(gsNode);
  }
  gsNode.setAttributeNS(W_NS, 'w:val', String(actualSpan));

  // 设置合并后总宽度
  if (combinedWidth > 0) {
    let tcW = baseTcPr.getElementsByTagNameNS(W_NS, 'tcW')?.[0];
    if (!tcW) {
      tcW = tblNode.ownerDocument.createElementNS(W_NS, 'w:tcW');
      baseTcPr.appendChild(tcW);
    }
    tcW.setAttributeNS(W_NS, 'w:w', String(combinedWidth));
  }

  if (engine?.refresh) {
    engine.refresh();
  }
  return { success: true, actualSpan, combinedWidth, combinedText: combinedTexts.join(' ') };
}

/**
 * 深拷贝源行格式并插入新数据行
 */
export function cloneAndInsertRow(engine, record, targetRowIndex, cloneFromRowIndex = 0) {
  if (!record || record.kind !== 'table') throw new DocxEngineError('当前记录不是表格', 'NOT_TABLE');
  const tblNode = record.tableNode || record.node || record.rows?.[0]?.node?.parentNode;
  if (!tblNode) throw new DocxEngineError('未找到表格 DOM 节点', 'NODE_NOT_FOUND');

  const trNodes = Array.from(tblNode.getElementsByTagNameNS(W_NS, 'tr'));
  const sourceIndex = Math.min(Math.max(cloneFromRowIndex, 0), trNodes.length - 1);
  const sourceTr = trNodes[sourceIndex];

  const newTr = sourceTr.cloneNode(true);
  const tcNodes = Array.from(newTr.getElementsByTagNameNS(W_NS, 'tc'));
  for (const tc of tcNodes) {
    const paras = Array.from(tc.getElementsByTagNameNS(W_NS, 'p'));
    paras.forEach(p => tc.removeChild(p));
    const emptyP = tblNode.ownerDocument.createElementNS(W_NS, 'w:p');
    tc.appendChild(emptyP);
  }

  if (targetRowIndex >= trNodes.length) {
    tblNode.appendChild(newTr);
  } else {
    tblNode.insertBefore(newTr, trNodes[targetRowIndex]);
  }

  if (engine?.refresh) {
    engine.refresh();
  }
  return { success: true, insertedAt: targetRowIndex };
}

/**
 * 字符 Run 级微观排版写入 (受控于全局 Design Tokens，彻底隔离内容与排版)
 */
export function writeRichTextToCell(cell, runs = [], options = {}) {
  if (!cell || !cell.node) throw new DocxEngineError('无效的单元格对象', 'INVALID_CELL');
  const tcNode = cell.node;
  const doc = tcNode.ownerDocument;
  const isEn = Boolean(options.isEnglish);
  const token = isEn ? MSDS_DESIGN_TOKENS.EN.TABLE_VALUE : MSDS_DESIGN_TOKENS.CN.TABLE_VALUE;

  const existingParas = Array.from(tcNode.getElementsByTagNameNS(W_NS, 'p'));
  existingParas.forEach(p => tcNode.removeChild(p));

  const p = doc.createElementNS(W_NS, 'w:p');
  const pPr = doc.createElementNS(W_NS, 'w:pPr');
  const spacing = doc.createElementNS(W_NS, 'w:spacing');
  spacing.setAttributeNS(W_NS, 'w:line', '280');
  spacing.setAttributeNS(W_NS, 'w:lineRule', 'auto');
  pPr.appendChild(spacing);
  p.appendChild(pPr);

  for (const item of runs) {
    const r = doc.createElementNS(W_NS, 'w:r');
    const rPr = doc.createElementNS(W_NS, 'w:rPr');

    const targetFont = item.fontFamily || token.font;
    const rFonts = doc.createElementNS(W_NS, 'w:rFonts');
    rFonts.setAttributeNS(W_NS, 'w:ascii', targetFont);
    rFonts.setAttributeNS(W_NS, 'w:hAnsi', targetFont);
    rFonts.setAttributeNS(W_NS, 'w:eastAsia', targetFont);
    rFonts.setAttributeNS(W_NS, 'w:cs', targetFont);
    rPr.appendChild(rFonts);

    if (item.bold) rPr.appendChild(doc.createElementNS(W_NS, 'w:b'));
    if (item.italic) rPr.appendChild(doc.createElementNS(W_NS, 'w:i'));

    if (item.subscript) {
      const vertAlign = doc.createElementNS(W_NS, 'w:vertAlign');
      vertAlign.setAttributeNS(W_NS, 'w:val', 'subscript');
      rPr.appendChild(vertAlign);
    } else if (item.superscript) {
      const vertAlign = doc.createElementNS(W_NS, 'w:vertAlign');
      vertAlign.setAttributeNS(W_NS, 'w:val', 'superscript');
      rPr.appendChild(vertAlign);
    }

    const sz = doc.createElementNS(W_NS, 'w:sz');
    const szVal = item.fontSizePt ? String(Math.round(item.fontSizePt * 2)) : token.sz;
    sz.setAttributeNS(W_NS, 'w:val', szVal);
    rPr.appendChild(sz);

    const szCs = doc.createElementNS(W_NS, 'w:szCs');
    szCs.setAttributeNS(W_NS, 'w:val', szVal);
    rPr.appendChild(szCs);

    r.appendChild(rPr);
    const t = doc.createElementNS(W_NS, 'w:t');
    t.textContent = item.text || '';
    if ((item.text || '').startsWith(' ') || (item.text || '').endsWith(' ')) {
      t.setAttribute('xml:space', 'preserve');
    }
    r.appendChild(t);
    p.appendChild(r);
  }

  tcNode.appendChild(p);
  return { success: true };
}

/**
 * 化学式自动下标转换辅助函数
 */
export function parseChemicalFormulaRuns(text, baseStyle = {}) {
  if (!text) return [];
  const runs = [];
  const regex = /([A-Za-z\(\)])(\d+)/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      runs.push({ ...baseStyle, text: text.slice(lastIndex, match.index) });
    }
    runs.push({ ...baseStyle, text: match[1] });
    runs.push({ ...baseStyle, text: match[2], subscript: true });
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    runs.push({ ...baseStyle, text: text.slice(lastIndex) });
  }

  return runs;
}

// @ANTIGRAVITY_INVARIANT_LOCK_START: APPLY_GLOBAL_TYPOGRAPHY_PROJECTION_IMMUTABLE
/**
 * 编辑器底层法定投影：全文档跨章节终审排版投影引擎 (Global Typography Projection Engine)
 * 物理杜绝跨章节字阶脱节、局部 Agent 私自篡改或审计误导修改。
 * 遍历全文档所有 16 个表格的所有值格，统一单向强制投影为标准 Design Tokens！
 * 包含：清理模板残留幽灵空 Run、标准字阶字体投影、符号规范化 (≥/≤、单位空格、标点纯净)。
 * 注意：必须使用 setAttribute('w:val', ...) 避免 xmldom 属性命名空间分裂导致重复属性。
 */
export function applyGlobalTypographyProjection(engine, isEnglish = false) {
  if (!engine?.documentXml) return;
  const doc = engine.documentXml;
  const tokens = isEnglish ? MSDS_DESIGN_TOKENS.EN : MSDS_DESIGN_TOKENS.CN;
  const targetFont = tokens.TABLE_VALUE.font;
  const targetSz = tokens.TABLE_VALUE.sz;

  const tables = Array.from(doc.getElementsByTagNameNS(W_NS, 'tbl'));
  for (let tIdx = 0; tIdx < tables.length; tIdx++) {
    const tbl = tables[tIdx];
    const rows = Array.from(tbl.getElementsByTagNameNS(W_NS, 'tr'));
    if (rows.length === 0) continue;

    // 探测 Section 编号
    let sectionNumber = tIdx + 1;
    const r0Text = (rows[0]?.textContent || '').trim();
    const secMatch = r0Text.match(/^(\d+)\./);
    if (secMatch) sectionNumber = parseInt(secMatch[1], 10);

    for (let rIdx = 0; rIdx < rows.length; rIdx++) {
      const row = rows[rIdx];
      const cells = Array.from(row.getElementsByTagNameNS(W_NS, 'tc'));
      if (cells.length === 0) continue;

      // 跳过 Row 0 (大标题行)
      if (rIdx === 0) continue;

      // 跳过成分表/控制参数表等列标题行
      const rowText = cells.map(c => (c.textContent || '').trim()).join(' ');
      if (/化学品名称.*CAS编号|物质.*依据.*类型|Components.*Basis.*Type|Substance.*Basis.*Type/i.test(rowText)) {
        continue;
      }

      // 跳过 Section 8 中的结构性题头行 (8.1 暴露控制 / 8.1 控制参数 / 8.1 Exposure controls / 工作场所组分控制参数)
      if (sectionNumber === 8 && /^(?:8\.1\s*(?:暴露控制|控制参数|Exposure\s*controls?)|工作场所组分控制参数|Control parameters for workplace components)/i.test(rowText)) {
        continue;
      }

      // Section 15 结构性子题头识别 (其它的规定 / 符合下列法规要求 / Other provisions / Complies with the following regulations)
      const isS15Subheader = sectionNumber === 15 && (
        /^(?:其它的规定|其它规定|其他规定|Other provisions|Other regulations)[：:]?/i.test(rowText) ||
        /^(?:符合下列法规要求|Complies with the following regulations|Comply with the following)[：:]?/i.test(rowText)
      );

      // 0. 对第 0 列标签单元格（多列表格中 c === 0）强制投影标准 Label Design Tokens 与折行对齐规范 (REQ-03, REQ-04, REQ-05)
      if (cells.length > 1) {
        const labelCell = cells[0];
        const labelText = (labelCell.textContent || '').trim();
        const isHeader = /^(?:化学品名称|CAS编号|含量%（w\/w）|Chemical\s*name|CAS\s*NO\.|Concentration\s*%\s*\(w\/w\)|物质|依据|类型|数值|Substance|Basis|Type|Value)$/i.test(labelText);
        if (!isHeader && labelText) {
          const targetLblSz = isEnglish ? '19' : '24';
          const targetLblFont = isEnglish ? 'Arial' : '宋体';
          const targetLblAscii = isEnglish ? 'Arial' : 'Times New Roman';
          const isS9Chinese = (!isEnglish && sectionNumber === 9);

          const ps = Array.from(labelCell.getElementsByTagNameNS(W_NS, 'p'));
          for (const p of ps) {
            // 全局物理清除段落级自动编号定义 (REQ-S3-DUP-PURGE)
            const numPrs = Array.from(p.getElementsByTagNameNS(W_NS, 'numPr'));
            numPrs.forEach(n => n.parentNode?.removeChild(n));
            const pPr = p.getElementsByTagNameNS(W_NS, 'pPr')[0];
            if (pPr) {
              const pRPr = pPr.getElementsByTagNameNS(W_NS, 'rPr')[0];
              if (pRPr) {
                let sz = pRPr.getElementsByTagNameNS(W_NS, 'sz')[0];
                if (sz && !isS9Chinese) sz.setAttribute('w:val', targetLblSz);
                let szCs = pRPr.getElementsByTagNameNS(W_NS, 'szCs')[0];
                if (szCs && !isS9Chinese) szCs.setAttribute('w:val', targetLblSz);
                let rFonts = pRPr.getElementsByTagNameNS(W_NS, 'rFonts')[0];
                if (rFonts) {
                  rFonts.setAttribute('w:ascii', targetLblAscii);
                  rFonts.setAttribute('w:hAnsi', targetLblAscii);
                  rFonts.setAttribute('w:eastAsia', targetLblFont);
                  rFonts.setAttribute('w:cs', targetLblAscii);
                }
              }

              // 9.1 外观黄金几何标尺与折行对齐规范 (REQ-GOLDEN-ANCHOR, REQ-SUB-PARENT-ALIGN, REQ-WRAP-VERTICAL-ALIGN)
              const pText = (p.textContent || '').trim();
              const mSeq = pText.match(/^(\d+\.\d+(?:\.\d+)?)\s*(.*)$/);
              const hasSeq = Boolean(mSeq);
              let ind = pPr.getElementsByTagNameNS(W_NS, 'ind')[0];
              if (hasSeq) {
                if (!ind) {
                  ind = doc.createElementNS(W_NS, 'w:ind');
                  pPr.appendChild(ind);
                }
                ind.setAttribute('w:left', '420');
                ind.setAttribute('w:hanging', '420');
                ind.removeAttribute('w:firstLine');
                ind.removeAttribute('w:firstLineChars');
                ind.removeAttribute('w:hangingChars');
                ind.removeAttribute('w:leftChars');
                ind.removeAttributeNS(W_NS, 'leftChars');
                ind.setAttributeNS(W_NS, 'w:leftChars', '0');

                // 确保父级带序号标签挂载 <w:tab/> 黄金锚点
                const existingTabs = p.getElementsByTagNameNS(W_NS, 'tab');
                if (existingTabs.length === 0 && mSeq) {
                  const seqStr = mSeq[1];
                  const labelPart = mSeq[2];
                  // 清理旧 Runs，重建为 带序号Run+<w:tab/> 与 标签文本Run
                  const oldRuns = Array.from(p.getElementsByTagNameNS(W_NS, 'r'));
                  oldRuns.forEach(r => p.removeChild(r));

                  // Run 1: 序号
                  const r1 = doc.createElementNS(W_NS, 'w:r');
                  const rPr1 = doc.createElementNS(W_NS, 'w:rPr');
                  const seqSz = !isEnglish ? (seqStr.length >= 5 ? '19' : '21') : (seqStr.length >= 5 ? '15' : '18');
                  const rf1 = doc.createElementNS(W_NS, 'w:rFonts');
                  rf1.setAttribute('w:ascii', targetLblAscii);
                  rf1.setAttribute('w:hAnsi', targetLblAscii);
                  rf1.setAttribute('w:eastAsia', targetLblFont);
                  rf1.setAttribute('w:cs', targetLblAscii);
                  rPr1.appendChild(rf1);
                  const b1 = doc.createElementNS(W_NS, 'w:b');
                  rPr1.appendChild(b1);
                  const sz1 = doc.createElementNS(W_NS, 'w:sz');
                  sz1.setAttribute('w:val', seqSz);
                  rPr1.appendChild(sz1);
                  const szCs1 = doc.createElementNS(W_NS, 'w:szCs');
                  szCs1.setAttribute('w:val', seqSz);
                  rPr1.appendChild(szCs1);
                  r1.appendChild(rPr1);

                  const t1 = doc.createElementNS(W_NS, 'w:t');
                  t1.textContent = seqStr;
                  r1.appendChild(t1);
                  const tab = doc.createElementNS(W_NS, 'w:tab');
                  r1.appendChild(tab);
                  p.appendChild(r1);

                  // Run 2: 标签
                  if (labelPart) {
                    const r2 = doc.createElementNS(W_NS, 'w:r');
                    const rPr2 = doc.createElementNS(W_NS, 'w:rPr');
                    const rf2 = doc.createElementNS(W_NS, 'w:rFonts');
                    rf2.setAttribute('w:ascii', targetLblAscii);
                    rf2.setAttribute('w:hAnsi', targetLblAscii);
                    rf2.setAttribute('w:eastAsia', targetLblFont);
                    rf2.setAttribute('w:cs', targetLblAscii);
                    rPr2.appendChild(rf2);
                    const b2 = doc.createElementNS(W_NS, 'w:b');
                    rPr2.appendChild(b2);
                    const sz2 = doc.createElementNS(W_NS, 'w:sz');
                    sz2.setAttribute('w:val', targetLblSz);
                    rPr2.appendChild(sz2);
                    const szCs2 = doc.createElementNS(W_NS, 'w:szCs');
                    szCs2.setAttribute('w:val', targetLblSz);
                    rPr2.appendChild(szCs2);
                    r2.appendChild(rPr2);

                    const t2 = doc.createElementNS(W_NS, 'w:t');
                    t2.textContent = labelPart;
                    r2.appendChild(t2);
                    p.appendChild(r2);
                  }
                }
              } else {
                // 子级无序号标签：必须显式注入 w:left="420"（清除 hanging 与 firstLine）
                // 使首字绝对平齐 420 dxa (80.28pt) 黄金基准线 (REQ-SUB-PARENT-ALIGN)
                if (!ind) {
                  ind = doc.createElementNS(W_NS, 'w:ind');
                  pPr.appendChild(ind);
                }
                ind.setAttribute('w:left', '420');
                ind.removeAttribute('w:hanging');
                ind.removeAttribute('w:hangingChars');
                ind.removeAttribute('w:firstLine');
                ind.removeAttribute('w:firstLineChars');
                ind.removeAttribute('w:leftChars');
                ind.removeAttributeNS(W_NS, 'leftChars');
                ind.setAttributeNS(W_NS, 'w:leftChars', '0');
              }
            }

            const runs = Array.from(p.getElementsByTagNameNS(W_NS, 'r'));
            for (const run of runs) {
              const runText = (run.textContent || '').trim();
              if (!runText && !run.getElementsByTagNameNS(W_NS, 'drawing').length && !run.getElementsByTagNameNS(W_NS, 'br').length && !run.getElementsByTagNameNS(W_NS, 'tab').length) {
                run.parentNode?.removeChild(run);
                continue;
              }

              let rPr = run.getElementsByTagNameNS(W_NS, 'rPr')[0];
              if (!rPr) {
                rPr = doc.createElementNS(W_NS, 'w:rPr');
                run.insertBefore(rPr, run.firstChild);
              }

              let b = rPr.getElementsByTagNameNS(W_NS, 'b')[0];
              if (!b) {
                b = doc.createElementNS(W_NS, 'w:b');
                rPr.appendChild(b);
              }
              let bCs = rPr.getElementsByTagNameNS(W_NS, 'bCs')[0];
              if (!bCs) {
                bCs = doc.createElementNS(W_NS, 'w:bCs');
                rPr.appendChild(bCs);
              }

              const isSeqRun = /^(\d+\.\d+(?:\.\d+)?)\s*$/.test(runText);
              let runSz = targetLblSz;
              if (isSeqRun) {
                if (!isEnglish) {
                  runSz = (runText.length >= 5) ? '19' : '21';
                } else {
                  runSz = (runText.length >= 5) ? '15' : '18';
                }
              }
              let sz = rPr.getElementsByTagNameNS(W_NS, 'sz')[0];
              if (!sz) {
                sz = doc.createElementNS(W_NS, 'w:sz');
                rPr.appendChild(sz);
              }
              sz.setAttribute('w:val', runSz);

              let szCs = rPr.getElementsByTagNameNS(W_NS, 'szCs')[0];
              if (!szCs) {
                szCs = doc.createElementNS(W_NS, 'w:szCs');
                rPr.appendChild(szCs);
              }
              szCs.setAttribute('w:val', runSz);

              let rFonts = rPr.getElementsByTagNameNS(W_NS, 'rFonts')[0];
              if (!rFonts) {
                rFonts = doc.createElementNS(W_NS, 'w:rFonts');
                rPr.appendChild(rFonts);
              }
              rFonts.setAttribute('w:ascii', targetLblAscii);
              rFonts.setAttribute('w:hAnsi', targetLblAscii);
              rFonts.setAttribute('w:eastAsia', targetLblFont);
              rFonts.setAttribute('w:cs', targetLblAscii);
            }
          }
        }
      }

      // 判定当前行是否属于子级标签行 (REQ-SUBVAL-RIGHT-INDENT)
      const labelText0 = (cells.length > 1 ? cells[0].textContent || '' : '').trim();
      const isSubLabelRow = (cells.length > 1) && !/^(\d+\.\d+(?:\.\d+)?)\b/.test(labelText0) && !/^(?:化学品名称|CAS编号|物质|依据|Substance|Basis)/i.test(labelText0);

      // 对所有值单元格（单列描述行或多列中 c >= 1 的列）强制投影标准 Design Tokens
      const startCol = (cells.length === 1) ? 0 : 1;
      for (let cIdx = startCol; cIdx < cells.length; cIdx++) {
        const cell = cells[cIdx];
        const cellText = (cell.textContent || '').trim();
        // 跳过固定表头字样
        if (/^(?:CAS编号|含量%（w\/w）|CAS NO\.|Concentration % \(w\/w\)|依据|类型|数值|Basis|Type|Value)$/i.test(cellText)) continue;

        // 1. 清理段落级 pPr -> rPr，消除从模板继承的加粗与残留字号污染
        const ps = Array.from(cell.getElementsByTagNameNS(W_NS, 'p'));
        for (const p of ps) {
          // 子级标签对应值单元格向右阶梯缩进 (REQ-SUBVAL-RIGHT-INDENT: 注入 w:left="240")
          if (isSubLabelRow && cIdx === 1) {
            let pPr = p.getElementsByTagNameNS(W_NS, 'pPr')[0];
            if (!pPr) {
              pPr = doc.createElementNS(W_NS, 'w:pPr');
              p.insertBefore(pPr, p.firstChild);
            }
            let ind = pPr.getElementsByTagNameNS(W_NS, 'ind')[0];
            if (!ind) {
              ind = doc.createElementNS(W_NS, 'w:ind');
              pPr.appendChild(ind);
            }
            ind.setAttribute('w:left', '240');
            ind.removeAttribute('w:hanging');
            ind.removeAttribute('w:firstLine');
            ind.removeAttribute('w:firstLineChars');
            ind.removeAttribute('w:leftChars');
            ind.removeAttributeNS(W_NS, 'leftChars');
            ind.setAttributeNS(W_NS, 'w:leftChars', '0');
          }

          // 全局物理清除段落级自动编号定义 (REQ-S3-DUP-PURGE)
          const numPrs = Array.from(p.getElementsByTagNameNS(W_NS, 'numPr'));
          numPrs.forEach(n => n.parentNode?.removeChild(n));
          const pPr = p.getElementsByTagNameNS(W_NS, 'pPr')[0];
          if (pPr) {
            const pRPr = pPr.getElementsByTagNameNS(W_NS, 'rPr')[0];
            if (pRPr) {
              const bs = Array.from(pRPr.getElementsByTagNameNS(W_NS, 'b'));
              bs.forEach(b => pRPr.removeChild(b));
              const bCss = Array.from(pRPr.getElementsByTagNameNS(W_NS, 'bCs'));
              bCss.forEach(b => pRPr.removeChild(b));
              let sz = pRPr.getElementsByTagNameNS(W_NS, 'sz')[0];
              if (sz) sz.setAttribute('w:val', targetSz);
              let szCs = pRPr.getElementsByTagNameNS(W_NS, 'szCs')[0];
              if (szCs) szCs.setAttribute('w:val', targetSz);
              let rFonts = pRPr.getElementsByTagNameNS(W_NS, 'rFonts')[0];
              if (rFonts) {
                rFonts.setAttribute('w:ascii', targetFont);
                rFonts.setAttribute('w:hAnsi', targetFont);
                rFonts.setAttribute('w:eastAsia', targetFont);
                rFonts.setAttribute('w:cs', targetFont);
              }
            }
          }
        }

        // 2. 遍历运行区 Runs，强制注入标准字阶、字体与字形并清理幽灵空节点
        const runs = Array.from(cell.getElementsByTagNameNS(W_NS, 'r'));
        for (const run of runs) {
          const runText = (run.textContent || '').trim();
          // 清理无文本且无图无换行的幽灵空 Run
          if (!runText && !run.getElementsByTagNameNS(W_NS, 'drawing').length && !run.getElementsByTagNameNS(W_NS, 'br').length) {
            run.parentNode?.removeChild(run);
            continue;
          }

          let rPr = run.getElementsByTagNameNS(W_NS, 'rPr')[0];
          if (!rPr) {
            rPr = doc.createElementNS(W_NS, 'w:rPr');
            run.insertBefore(rPr, run.firstChild);
          }

          // 2.1 强制统一字阶 (sz 与 szCs)
          let sz = rPr.getElementsByTagNameNS(W_NS, 'sz')[0];
          if (!sz) {
            sz = doc.createElementNS(W_NS, 'w:sz');
            rPr.appendChild(sz);
          }
          sz.setAttribute('w:val', targetSz);

          let szCs = rPr.getElementsByTagNameNS(W_NS, 'szCs')[0];
          if (!szCs) {
            szCs = doc.createElementNS(W_NS, 'w:szCs');
            rPr.appendChild(szCs);
          }
          szCs.setAttribute('w:val', targetSz);

          // 2.2 强制统一字体家族 (ascii, hAnsi, eastAsia, cs)
          let rFonts = rPr.getElementsByTagNameNS(W_NS, 'rFonts')[0];
          if (!rFonts) {
            rFonts = doc.createElementNS(W_NS, 'w:rFonts');
            rPr.appendChild(rFonts);
          }
          rFonts.setAttribute('w:ascii', targetFont);
          rFonts.setAttribute('w:hAnsi', targetFont);
          rFonts.setAttribute('w:eastAsia', targetFont);
          rFonts.setAttribute('w:cs', targetFont);

          // 2.3 粗细隔离与法定标签加粗保护 (INV-BOLD-S2-S15):
          // - Section 15 结构性子题头 (其它的规定、符合下列法规要求) 强制加粗
          // - Section 2 结构性节标题与子标签 (2.1-2.5 标题、象形图、信号词、防范四大块等) 强制加粗
          // - 受控合法子标签 (如 "经口："、"预防措施：" 等) 保持加粗
          // - 普通值格正文严禁加粗
          const isS2Label = sectionNumber === 2 && (
            /^(?:(?:2\.\d+\s*)?(?:GHS\s*危险性类别|GHS\s*分类|Classification of the substance or mixture|GHS\s*Classification|GHS\s*标签要素|Label elements|GHS\s*Label\s*Elements|危险性说明|危害性说明|Hazard\s*statements?|防范说明|Precautionary\s*statements?|其他危害|其他危险|Other\s*hazards?)|(?:GHS\s*)?(?:象形图|pictograms?)|(?:警告词|信号词|Signal\s*word)|(?:必须列在标签上的有害成[份分]|Hazardous components which must be listed on the label)|(?:需要注意的物质|Substances?\s*(?:of\s*concern|to\s*be\s*noted))|(?:预防措施|事故响应|安全存储|安全储存|废弃处置|Prevention|Response|Storage|Disposal))[：:]?$/i.test(runText) ||
            /^[：:]$/.test(runText)
          );

          if (isS15Subheader || isS2Label) {
            let b = rPr.getElementsByTagNameNS(W_NS, 'b')[0];
            if (!b) {
              b = doc.createElementNS(W_NS, 'w:b');
              rPr.appendChild(b);
            }
            let bCs = rPr.getElementsByTagNameNS(W_NS, 'bCs')[0];
            if (!bCs) {
              bCs = doc.createElementNS(W_NS, 'w:bCs');
              rPr.appendChild(bCs);
            }
          } else {
            const isSubLabel = /^(预防措施|事故响应|安全储存|废弃处置|经口|吸入|经皮|物种|分类|结果|重复剂量中毒|病理变化|致畸形|致畸性|致畸|生育力|Oral|Inhalation|Dermal|Species|Classification|Result|Repeated dose toxicity|Pathological changes|Teratogenicity|Fertility|Prevention|Response|Storage|Disposal)[：:]?$/i.test(runText) || /^[：:]$/.test(runText);
            if (!isSubLabel) {
              const bs = Array.from(rPr.getElementsByTagNameNS(W_NS, 'b'));
              bs.forEach(b => rPr.removeChild(b));
              const bCss = Array.from(rPr.getElementsByTagNameNS(W_NS, 'bCs'));
              bCss.forEach(b => rPr.removeChild(b));
            }
          }
        }

        // 3. 值格符号排版规范化（≥/≤ 统一、单位空格、标点纯净）
        const tNodes = Array.from(cell.getElementsByTagNameNS(W_NS, 't'));
        for (const t of tNodes) {
          if (t.textContent) {
            let tc = t.textContent
              .replace(/≧/g, '≥')
              .replace(/≦/g, '≤')
              .replace(/(\d+(?:\.\d+)?)\s*(mm|min)\b/gi, '$1 $2')
              .replace(/\b(min|mm)\.\s*$/gi, '$1');
            if (isEnglish) {
              tc = tc.replace(/；/g, '; ');
              // 消除西文连词粘连 (如 (SCBA)Do -> (SCBA) Do, equipmentEnsure -> equipment. Ensure)
              tc = tc.replace(/([.!?\)])([A-Za-z])/g, '$1 $2');
              // 仅非缩写且长度大于15个字符的完整英文陈述句，末尾保留或自动补齐句号 (DEF-14)
              if (tc.length > 15 && !/[.!?:]$/.test(tc) && !/\b(?:min|mm|CAS|EC|No|N\/A|None)\.?$/i.test(tc)) {
                tc = tc + '.';
              }
            } else {
              tc = tc.replace(/;\s*|；\s*/g, '；');
              tc = tc.replace(/\.$/, '');
            }
            t.textContent = tc;
          }
        }
      }
    }
  }
}
// @ANTIGRAVITY_INVARIANT_LOCK_END
