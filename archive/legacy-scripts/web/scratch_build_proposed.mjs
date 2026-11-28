import fs from 'node:fs';

const origPath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/universal-editor-primitives.js';
const origContent = fs.readFileSync(origPath, 'utf8');

// Build the complete proposed content
const proposedTokens = `// @ANTIGRAVITY_INVARIANT_LOCK_START: MSDS_UNIVERSAL_DESIGN_TOKENS_IMMUTABLE
/**
 * MSDS 全文档工业级设计令牌单一真理源 (Single Source of Truth)
 * 彻底隔离内容与排版。上层业务代码只允许写入纯文本事实，严禁在局部私自指定或篡改字阶与字体！
 * 全篇 16 个章节与页眉页脚，全部受控于本真理源，严格杜绝局部特判与字阶断层。
 */
export const MSDS_DESIGN_TOKENS = Object.freeze({
  CN: Object.freeze({
    SECTION_HEADER: Object.freeze({ font: '宋体', asciiFont: 'Times New Roman', sz: '24', szCs: '24', sizePt: 12, bold: true }),
    LABEL_BOLD: Object.freeze({ font: '宋体', asciiFont: 'Times New Roman', sz: '24', szCs: '24', sizePt: 12, bold: true }),
    LABEL_SEQ: Object.freeze({ font: 'Times New Roman', asciiFont: 'Times New Roman', sz: '21', szCs: '21', sizePt: 10.5, bold: true }),
    LABEL_SEQ_TIER_B: Object.freeze({ font: 'Times New Roman', asciiFont: 'Times New Roman', sz: '19', szCs: '19', sizePt: 9.5, bold: true }),
    TABLE_VALUE: Object.freeze({ font: '宋体', asciiFont: 'Times New Roman', sz: '24', szCs: '24', sizePt: 12, bold: false }), // 全局 16 章节值格恒为小四号 12pt 宋体常规体
    TABLE_HEADER: Object.freeze({ font: '宋体', asciiFont: 'Times New Roman', sz: '24', szCs: '24', sizePt: 12, bold: true }),
    PREAMBLE: Object.freeze({ font: '宋体', asciiFont: 'Times New Roman', sz: '24', szCs: '24', sizePt: 12, bold: false }),
    HEADER: Object.freeze({ font: '宋体', asciiFont: 'Times New Roman', sz: '18', szCs: '18', sizePt: 9, bold: false }),
    FOOTER: Object.freeze({ font: '宋体', asciiFont: 'Times New Roman', sz: '18', szCs: '18', sizePt: 9, bold: false }),
  }),
  EN: Object.freeze({
    SECTION_HEADER: Object.freeze({ font: 'Arial', asciiFont: 'Arial', sz: '22', szCs: '22', sizePt: 11, bold: true }),
    LABEL_BOLD: Object.freeze({ font: 'Arial', asciiFont: 'Arial', sz: '19', szCs: '19', sizePt: 9.5, bold: true }),
    LABEL_SEQ: Object.freeze({ font: 'Arial', asciiFont: 'Arial', sz: '19', szCs: '19', sizePt: 9.5, bold: true }), // 英文全篇 16 章节所有序号恒定为 9.5pt (sz="19")
    LABEL_SEQ_TIER_B: Object.freeze({ font: 'Arial', asciiFont: 'Arial', sz: '19', szCs: '19', sizePt: 9.5, bold: true }),
    TABLE_VALUE: Object.freeze({ font: 'Arial', asciiFont: 'Arial', sz: '19', szCs: '19', sizePt: 9.5, bold: false }), // 全局 16 章节值格恒为五号 9.5pt Arial 常规体
    TABLE_HEADER: Object.freeze({ font: 'Arial', asciiFont: 'Arial', sz: '19', szCs: '19', sizePt: 9.5, bold: true }),
    PREAMBLE: Object.freeze({ font: 'Arial', asciiFont: 'Arial', sz: '19', szCs: '19', sizePt: 9.5, bold: false }),
    HEADER: Object.freeze({ font: 'Arial', asciiFont: 'Arial', sz: '18', szCs: '18', sizePt: 9, bold: false }),
    FOOTER: Object.freeze({ font: 'Arial', asciiFont: 'Arial', sz: '18', szCs: '18', sizePt: 9, bold: false }),
  })
});
// @ANTIGRAVITY_INVARIANT_LOCK_END`;

const proposedProjection = `// @ANTIGRAVITY_INVARIANT_LOCK_START: APPLY_GLOBAL_TYPOGRAPHY_PROJECTION_IMMUTABLE
/**
 * 编辑器底层法定投影：全文档跨章节终审排版投影引擎 (Global Typography Projection Engine)
 * 物理杜绝跨章节字阶脱节、局部 Agent 私自篡改或审计误导修改。
 * 遍历全文档所有 16 个表格的所有行、列、单元格、段落与 Run，以及页眉页脚底层 XML，统一单向强制投影为标准 Design Tokens！
 * 彻底废除任何针对字符长度局部缩小英文序号至 18 或 15 的非标准逻辑！
 * 包含：页眉页脚 XML 投影、16 章节大标题 Row 0 投影、第 0 列序号/标签投影、填写值顶格左对齐常规体投影、复合通栏行原生解耦。
 */
export function applyGlobalTypographyProjection(engine, isEnglish = false) {
  if (!engine?.documentXml) return;
  const doc = engine.documentXml;
  const tokens = isEnglish ? MSDS_DESIGN_TOKENS.EN : MSDS_DESIGN_TOKENS.CN;
  const targetFont = tokens.TABLE_VALUE.font;
  const targetSz = tokens.TABLE_VALUE.sz;
  const targetAscii = tokens.TABLE_VALUE.asciiFont || targetFont;

  // 1. 全局投影页眉页脚底层 XML (Header & Footer Typography Projection)
  if (engine?.supportingXml) {
    const hdrFtrToken = tokens.HEADER;
    const fontName = hdrFtrToken.font;
    const asciiFont = hdrFtrToken.asciiFont || fontName;
    const szVal = hdrFtrToken.sz; // '18' (9pt)

    for (const [partName, xmlText] of Object.entries(engine.supportingXml)) {
      if (!/^word\\/(?:header|footer)\\d+\\.xml$/.test(partName) || !xmlText) continue;
      try {
        const domParser = new (globalThis.DOMParser || DOMParser)();
        const partDoc = domParser.parseFromString(xmlText, 'application/xml');
        const isHeader = /header/i.test(partName);
        let modified = false;

        if (isHeader) {
          const pars = Array.from(partDoc.getElementsByTagNameNS(W_NS, 'p'));
          for (let pIdx = 0; pIdx < Math.min(2, pars.length); pIdx++) {
            const p = pars[pIdx];
            const runs = Array.from(p.getElementsByTagNameNS(W_NS, 'r'));
            for (const r of runs) {
              let rPr = r.getElementsByTagNameNS(W_NS, 'rPr')[0] || partDoc.createElementNS(W_NS, 'w:rPr');
              if (!rPr.parentNode) r.insertBefore(rPr, r.firstChild);
              const bs = Array.from(rPr.getElementsByTagNameNS(W_NS, 'b'));
              bs.forEach(b => rPr.removeChild(b));
              const bCss = Array.from(rPr.getElementsByTagNameNS(W_NS, 'bCs'));
              bCss.forEach(b => rPr.removeChild(b));
              let sz = rPr.getElementsByTagNameNS(W_NS, 'sz')[0] || partDoc.createElementNS(W_NS, 'w:sz');
              sz.setAttribute('w:val', szVal);
              if (!sz.parentNode) rPr.appendChild(sz);
              let szCs = rPr.getElementsByTagNameNS(W_NS, 'szCs')[0] || partDoc.createElementNS(W_NS, 'w:szCs');
              szCs.setAttribute('w:val', szVal);
              if (!szCs.parentNode) rPr.appendChild(szCs);
              let rFonts = rPr.getElementsByTagNameNS(W_NS, 'rFonts')[0] || partDoc.createElementNS(W_NS, 'w:rFonts');
              rFonts.setAttribute('w:ascii', asciiFont);
              rFonts.setAttribute('w:hAnsi', asciiFont);
              rFonts.setAttribute('w:eastAsia', fontName);
              rFonts.setAttribute('w:cs', asciiFont);
              if (!rFonts.parentNode) rPr.appendChild(rFonts);
              modified = true;
            }
          }
          const tbl = partDoc.getElementsByTagNameNS(W_NS, 'tbl')[0];
          if (tbl) {
            const tc = tbl.getElementsByTagNameNS(W_NS, 'tc')[0];
            const p = tc?.getElementsByTagNameNS(W_NS, 'p')[0];
            if (p) {
              const runs = Array.from(p.getElementsByTagNameNS(W_NS, 'r'));
              for (const r of runs) {
                let rPr = r.getElementsByTagNameNS(W_NS, 'rPr')[0] || partDoc.createElementNS(W_NS, 'w:rPr');
                if (!rPr.parentNode) r.insertBefore(rPr, r.firstChild);
                let b = rPr.getElementsByTagNameNS(W_NS, 'w:b')[0] || partDoc.createElementNS(W_NS, 'w:b');
                if (!b.parentNode) rPr.appendChild(b);
                let sz = rPr.getElementsByTagNameNS(W_NS, 'sz')[0] || partDoc.createElementNS(W_NS, 'w:sz');
                sz.setAttribute('w:val', szVal);
                if (!sz.parentNode) rPr.appendChild(sz);
                let szCs = rPr.getElementsByTagNameNS(W_NS, 'szCs')[0] || partDoc.createElementNS(W_NS, 'w:szCs');
                szCs.setAttribute('w:val', szVal);
                if (!szCs.parentNode) rPr.appendChild(szCs);
                let rFonts = rPr.getElementsByTagNameNS(W_NS, 'rFonts')[0] || partDoc.createElementNS(W_NS, 'w:rFonts');
                rFonts.setAttribute('w:ascii', asciiFont);
                rFonts.setAttribute('w:hAnsi', asciiFont);
                rFonts.setAttribute('w:eastAsia', fontName);
                rFonts.setAttribute('w:cs', asciiFont);
                if (!rFonts.parentNode) rPr.appendChild(rFonts);
                modified = true;
              }
            }
          }
        } else {
          // 页脚处理: 全量 9pt 常规体，Cell 0 靠左，清除残留 w:firstLine="8730"
          const tbl = partDoc.getElementsByTagNameNS(W_NS, 'tbl')[0];
          if (tbl) {
            const tr = tbl.getElementsByTagNameNS(W_NS, 'tr')[0];
            if (tr) {
              const tcs = Array.from(tr.getElementsByTagNameNS(W_NS, 'tc'));
              if (tcs[0]) {
                const p = tcs[0].getElementsByTagNameNS(W_NS, 'p')[0];
                if (p) {
                  let pPr = p.getElementsByTagNameNS(W_NS, 'pPr')[0] || partDoc.createElementNS(W_NS, 'w:pPr');
                  if (!pPr.parentNode) p.insertBefore(pPr, p.firstChild);
                  let jc = pPr.getElementsByTagNameNS(W_NS, 'w:jc')[0] || partDoc.createElementNS(W_NS, 'w:jc');
                  jc.setAttribute('w:val', 'left');
                  if (!jc.parentNode) pPr.appendChild(jc);
                  const ind = pPr.getElementsByTagNameNS(W_NS, 'ind')[0];
                  if (ind) pPr.removeChild(ind);
                  modified = true;
                }
              }
              if (tcs[1]) {
                const p = tcs[1].getElementsByTagNameNS(W_NS, 'p')[0];
                if (p) {
                  let pPr = p.getElementsByTagNameNS(W_NS, 'pPr')[0] || partDoc.createElementNS(W_NS, 'w:pPr');
                  if (!pPr.parentNode) p.insertBefore(pPr, p.firstChild);
                  let jc = pPr.getElementsByTagNameNS(W_NS, 'w:jc')[0] || partDoc.createElementNS(W_NS, 'w:jc');
                  jc.setAttribute('w:val', 'right');
                  if (!jc.parentNode) pPr.appendChild(jc);
                  const ind = pPr.getElementsByTagNameNS(W_NS, 'ind')[0];
                  if (ind) pPr.removeChild(ind);
                  modified = true;
                }
              }
              const runs = Array.from(tbl.getElementsByTagNameNS(W_NS, 'r'));
              for (const r of runs) {
                let rPr = r.getElementsByTagNameNS(W_NS, 'rPr')[0] || partDoc.createElementNS(W_NS, 'w:rPr');
                if (!rPr.parentNode) r.insertBefore(rPr, r.firstChild);
                const bs = Array.from(rPr.getElementsByTagNameNS(W_NS, 'b'));
                bs.forEach(b => rPr.removeChild(b));
                const bCss = Array.from(rPr.getElementsByTagNameNS(W_NS, 'bCs'));
                bCss.forEach(b => rPr.removeChild(b));
                let sz = rPr.getElementsByTagNameNS(W_NS, 'sz')[0] || partDoc.createElementNS(W_NS, 'w:sz');
                sz.setAttribute('w:val', szVal);
                if (!sz.parentNode) rPr.appendChild(sz);
                let szCs = rPr.getElementsByTagNameNS(W_NS, 'szCs')[0] || partDoc.createElementNS(W_NS, 'w:szCs');
                szCs.setAttribute('w:val', szVal);
                if (!szCs.parentNode) rPr.appendChild(szCs);
                let rFonts = rPr.getElementsByTagNameNS(W_NS, 'rFonts')[0] || partDoc.createElementNS(W_NS, 'w:rFonts');
                rFonts.setAttribute('w:ascii', asciiFont);
                rFonts.setAttribute('w:hAnsi', asciiFont);
                rFonts.setAttribute('w:eastAsia', fontName);
                rFonts.setAttribute('w:cs', asciiFont);
                if (!rFonts.parentNode) rPr.appendChild(rFonts);
                modified = true;
              }
            }
          }
        }

        if (modified) {
          const xmlSerializer = new (globalThis.XMLSerializer || XMLSerializer)();
          engine.supportingXml[partName] = xmlSerializer.serializeToString(partDoc);
        }
      } catch (err) {
        console.warn('applyGlobalTypographyProjection: failed updating header/footer', partName, err);
      }
    }
  }

  // 2. 全篇 16 个章节表格底层拓扑投影
  const tables = Array.from(doc.getElementsByTagNameNS(W_NS, 'tbl'));
  for (let tIdx = 0; tIdx < tables.length; tIdx++) {
    const tbl = tables[tIdx];
    const rows = Array.from(tbl.getElementsByTagNameNS(W_NS, 'tr'));
    if (rows.length === 0) continue;

    let sectionNumber = tIdx + 1;
    const r0Text = (rows[0]?.textContent || '').trim();
    const secMatch = r0Text.match(/^(\\d+)\\./);
    if (secMatch) sectionNumber = parseInt(secMatch[1], 10);

    // 探测当前章节最大序号位数 (REQ-TIER-DISCOVERY)
    let maxSeqDigitCount = 0;
    for (const r of rows) {
      const c0 = r.getElementsByTagNameNS(W_NS, 'tc')[0];
      if (!c0) continue;
      const c0Text = (c0.textContent || '').trim();
      const mSeq = c0Text.match(/^(\\d+\\.\\d+(?:\\.\\d+)?)/);
      if (mSeq) {
        const digitsOnly = mSeq[1].replace(/\\D/g, '');
        if (digitsOnly.length > maxSeqDigitCount) {
          maxSeqDigitCount = digitsOnly.length;
        }
      }
    }
    const isTierB = (maxSeqDigitCount >= 4) || (sectionNumber === 11);
    const targetIndent = isTierB ? '560' : '420';

    for (let rIdx = 0; rIdx < rows.length; rIdx++) {
      const row = rows[rIdx];
      const cells = Array.from(row.getElementsByTagNameNS(W_NS, 'tc'));
      if (cells.length === 0) continue;

      // 2.1 Row 0 (大标题行): 强制投影 tokens.SECTION_HEADER (CN 12pt 宋体加粗, EN 11pt Arial 加粗)
      if (rIdx === 0) {
        const secHeaderToken = tokens.SECTION_HEADER;
        for (const cell of cells) {
          const ps = Array.from(cell.getElementsByTagNameNS(W_NS, 'p'));
          for (const p of ps) {
            const runs = Array.from(p.getElementsByTagNameNS(W_NS, 'r'));
            for (const run of runs) {
              const runText = (run.textContent || '').trim();
              if (!runText) {
                run.parentNode?.removeChild(run);
                continue;
              }
              let rPr = run.getElementsByTagNameNS(W_NS, 'rPr')[0] || doc.createElementNS(W_NS, 'w:rPr');
              if (!rPr.parentNode) run.insertBefore(rPr, run.firstChild);
              let b = rPr.getElementsByTagNameNS(W_NS, 'b')[0] || doc.createElementNS(W_NS, 'w:b');
              if (!b.parentNode) rPr.appendChild(b);
              let bCs = rPr.getElementsByTagNameNS(W_NS, 'bCs')[0] || doc.createElementNS(W_NS, 'w:bCs');
              if (!bCs.parentNode) rPr.appendChild(bCs);
              let sz = rPr.getElementsByTagNameNS(W_NS, 'sz')[0] || doc.createElementNS(W_NS, 'w:sz');
              sz.setAttribute('w:val', secHeaderToken.sz);
              if (!sz.parentNode) rPr.appendChild(sz);
              let szCs = rPr.getElementsByTagNameNS(W_NS, 'szCs')[0] || doc.createElementNS(W_NS, 'w:szCs');
              szCs.setAttribute('w:val', secHeaderToken.szCs);
              if (!szCs.parentNode) rPr.appendChild(szCs);
              let rFonts = rPr.getElementsByTagNameNS(W_NS, 'rFonts')[0] || doc.createElementNS(W_NS, 'w:rFonts');
              rFonts.setAttribute('w:ascii', isEnglish ? 'Arial' : 'Times New Roman');
              rFonts.setAttribute('w:hAnsi', isEnglish ? 'Arial' : 'Times New Roman');
              rFonts.setAttribute('w:eastAsia', isEnglish ? 'Arial' : '宋体');
              rFonts.setAttribute('w:cs', isEnglish ? 'Arial' : 'Times New Roman');
              if (!rFonts.parentNode) rPr.appendChild(rFonts);
            }
          }
        }
        continue;
      }

      // 2.2 列标题行 (如成分表 CAS编号/含量% 或 依据/类型/数值)
      const rowText = cells.map(c => (c.textContent || '').trim()).join(' ');
      if (/化学品名称.*CAS编号|物质.*依据.*类型|Components.*Basis.*Type|Substance.*Basis.*Type|Component.*CAS/i.test(rowText)) {
        const tblHeaderToken = tokens.TABLE_HEADER;
        for (const cell of cells) {
          const ps = Array.from(cell.getElementsByTagNameNS(W_NS, 'p'));
          for (const p of ps) {
            const runs = Array.from(p.getElementsByTagNameNS(W_NS, 'r'));
            for (const run of runs) {
              const runText = (run.textContent || '').trim();
              if (!runText) continue;
              let rPr = run.getElementsByTagNameNS(W_NS, 'rPr')[0] || doc.createElementNS(W_NS, 'w:rPr');
              if (!rPr.parentNode) run.insertBefore(rPr, run.firstChild);
              let b = rPr.getElementsByTagNameNS(W_NS, 'b')[0] || doc.createElementNS(W_NS, 'w:b');
              if (!b.parentNode) rPr.appendChild(b);
              let sz = rPr.getElementsByTagNameNS(W_NS, 'sz')[0] || doc.createElementNS(W_NS, 'w:sz');
              sz.setAttribute('w:val', tblHeaderToken.sz);
              if (!sz.parentNode) rPr.appendChild(sz);
              let szCs = rPr.getElementsByTagNameNS(W_NS, 'szCs')[0] || doc.createElementNS(W_NS, 'w:szCs');
              szCs.setAttribute('w:val', tblHeaderToken.szCs);
              if (!szCs.parentNode) rPr.appendChild(szCs);
              let rFonts = rPr.getElementsByTagNameNS(W_NS, 'rFonts')[0] || doc.createElementNS(W_NS, 'w:rFonts');
              rFonts.setAttribute('w:ascii', isEnglish ? 'Arial' : 'Times New Roman');
              rFonts.setAttribute('w:hAnsi', isEnglish ? 'Arial' : 'Times New Roman');
              rFonts.setAttribute('w:eastAsia', isEnglish ? 'Arial' : '宋体');
              rFonts.setAttribute('w:cs', isEnglish ? 'Arial' : 'Times New Roman');
              if (!rFonts.parentNode) rPr.appendChild(rFonts);
            }
          }
        }
        continue;
      }

      // 2.3 多列表格行 (cells.length > 1)
      if (cells.length > 1) {
        // A. Column 0: 标签单元格
        const labelCell = cells[0];
        const labelText = (labelCell.textContent || '').trim();
        if (labelText) {
          const targetLblSz = tokens.LABEL_BOLD.sz; // '19' (EN) / '24' (CN)
          const targetLblFont = isEnglish ? 'Arial' : '宋体';
          const targetLblAscii = isEnglish ? 'Arial' : 'Times New Roman';
          const targetSeqSz = isEnglish ? tokens.LABEL_SEQ.sz : (isTierB ? tokens.LABEL_SEQ_TIER_B.sz : tokens.LABEL_SEQ.sz); // '19' (EN) / '21'|'19' (CN)
          const targetSeqFont = isEnglish ? 'Arial' : 'Times New Roman';

          const ps = Array.from(labelCell.getElementsByTagNameNS(W_NS, 'p'));
          for (const p of ps) {
            const numPrs = Array.from(p.getElementsByTagNameNS(W_NS, 'numPr'));
            numPrs.forEach(n => n.parentNode?.removeChild(n));

            const pPr = p.getElementsByTagNameNS(W_NS, 'pPr')[0] || doc.createElementNS(W_NS, 'w:pPr');
            if (!pPr.parentNode) p.insertBefore(pPr, p.firstChild);

            const pText = (p.textContent || '').trim();
            const mSeq = pText.match(/^(\\d+\\.\\d+(?:\\.\\d+)?)\\s*(.*)$/);
            const hasSeq = Boolean(mSeq);

            if (hasSeq) {
              let ind = pPr.getElementsByTagNameNS(W_NS, 'ind')[0] || doc.createElementNS(W_NS, 'w:ind');
              ind.setAttribute('w:left', targetIndent);
              ind.setAttribute('w:hanging', targetIndent);
              ind.removeAttribute('w:firstLine');
              ind.removeAttribute('w:firstLineChars');
              ind.removeAttribute('w:hangingChars');
              ind.removeAttribute('w:leftChars');
              ind.removeAttributeNS(W_NS, 'leftChars');
              ind.setAttributeNS(W_NS, 'w:leftChars', '0');
              if (!ind.parentNode) pPr.appendChild(ind);

              const existingTabs = p.getElementsByTagNameNS(W_NS, 'tab');
              if (existingTabs.length === 0 && mSeq) {
                const seqStr = mSeq[1];
                let labelPart = mSeq[2];
                if (isEnglish) {
                  labelPart = labelPart.replace(/：/g, ':').trim();
                  if (!labelPart.endsWith(':') && !labelPart.includes('Other information') && !labelPart.includes('Additional')) {
                    labelPart += ':';
                  }
                } else {
                  if (!/[：:]$/.test(labelPart) && !labelPart.includes('其他信息')) {
                    labelPart += '：';
                  }
                }

                const oldRuns = Array.from(p.getElementsByTagNameNS(W_NS, 'r'));
                oldRuns.forEach(r => p.removeChild(r));

                // Run 1: 序号 (加粗 + Tab)
                const r1 = doc.createElementNS(W_NS, 'w:r');
                const rPr1 = doc.createElementNS(W_NS, 'w:rPr');
                const rf1 = doc.createElementNS(W_NS, 'w:rFonts');
                rf1.setAttribute('w:ascii', targetSeqFont);
                rf1.setAttribute('w:hAnsi', targetSeqFont);
                rf1.setAttribute('w:eastAsia', isEnglish ? 'Arial' : '宋体');
                rf1.setAttribute('w:cs', targetSeqFont);
                rPr1.appendChild(rf1);
                rPr1.appendChild(doc.createElementNS(W_NS, 'w:b'));
                rPr1.appendChild(doc.createElementNS(W_NS, 'w:bCs'));
                const sz1 = doc.createElementNS(W_NS, 'w:sz');
                sz1.setAttribute('w:val', targetSeqSz);
                rPr1.appendChild(sz1);
                const szCs1 = doc.createElementNS(W_NS, 'w:szCs');
                szCs1.setAttribute('w:val', targetSeqSz);
                rPr1.appendChild(szCs1);
                r1.appendChild(rPr1);

                const t1 = doc.createElementNS(W_NS, 'w:t');
                t1.textContent = seqStr;
                r1.appendChild(t1);
                const tab = doc.createElementNS(W_NS, 'w:tab');
                r1.appendChild(tab);
                p.appendChild(r1);

                // Run 2: 标签文本 (加粗)
                if (labelPart) {
                  const r2 = doc.createElementNS(W_NS, 'w:r');
                  const rPr2 = doc.createElementNS(W_NS, 'w:rPr');
                  const rf2 = doc.createElementNS(W_NS, 'w:rFonts');
                  rf2.setAttribute('w:ascii', targetLblAscii);
                  rf2.setAttribute('w:hAnsi', targetLblAscii);
                  rf2.setAttribute('w:eastAsia', targetLblFont);
                  rf2.setAttribute('w:cs', targetLblAscii);
                  rPr2.appendChild(rf2);
                  rPr2.appendChild(doc.createElementNS(W_NS, 'w:b'));
                  rPr2.appendChild(doc.createElementNS(W_NS, 'w:bCs'));
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
              // 无序号标签 (如 手部防护：, Hand protection:)
              let ind = pPr.getElementsByTagNameNS(W_NS, 'ind')[0] || doc.createElementNS(W_NS, 'w:ind');
              ind.setAttribute('w:left', targetIndent);
              ind.removeAttribute('w:hanging');
              ind.removeAttribute('w:hangingChars');
              ind.removeAttribute('w:firstLine');
              ind.removeAttribute('w:firstLineChars');
              ind.removeAttribute('w:leftChars');
              ind.removeAttributeNS(W_NS, 'leftChars');
              ind.setAttributeNS(W_NS, 'w:leftChars', '0');
              if (!ind.parentNode) pPr.appendChild(ind);
            }

            // 遍历所有 Runs，严格强制注入标准字阶与字体 (彻底消灭 18/15 降级)
            const runs = Array.from(p.getElementsByTagNameNS(W_NS, 'r'));
            for (const run of runs) {
              const runText = (run.textContent || '').trim();
              if (!runText && !run.getElementsByTagNameNS(W_NS, 'drawing').length && !run.getElementsByTagNameNS(W_NS, 'br').length && !run.getElementsByTagNameNS(W_NS, 'tab').length) {
                run.parentNode?.removeChild(run);
                continue;
              }
              let rPr = run.getElementsByTagNameNS(W_NS, 'rPr')[0] || doc.createElementNS(W_NS, 'w:rPr');
              if (!rPr.parentNode) run.insertBefore(rPr, run.firstChild);

              let b = rPr.getElementsByTagNameNS(W_NS, 'b')[0] || doc.createElementNS(W_NS, 'w:b');
              if (!b.parentNode) rPr.appendChild(b);
              let bCs = rPr.getElementsByTagNameNS(W_NS, 'bCs')[0] || doc.createElementNS(W_NS, 'w:bCs');
              if (!bCs.parentNode) rPr.appendChild(bCs);

              const isSeqRun = run.getElementsByTagNameNS(W_NS, 'tab').length > 0 || /^(\\d+\\.\\d+(?:\\.\\d+)?)\\s*$/.test(runText);
              const runSz = isSeqRun ? targetSeqSz : targetLblSz;
              const runAscii = isSeqRun ? targetSeqFont : targetLblAscii;

              let sz = rPr.getElementsByTagNameNS(W_NS, 'sz')[0] || doc.createElementNS(W_NS, 'w:sz');
              sz.setAttribute('w:val', runSz);
              if (!sz.parentNode) rPr.appendChild(sz);
              let szCs = rPr.getElementsByTagNameNS(W_NS, 'szCs')[0] || doc.createElementNS(W_NS, 'w:szCs');
              szCs.setAttribute('w:val', runSz);
              if (!szCs.parentNode) rPr.appendChild(szCs);

              let rFonts = rPr.getElementsByTagNameNS(W_NS, 'rFonts')[0] || doc.createElementNS(W_NS, 'w:rFonts');
              rFonts.setAttribute('w:ascii', runAscii);
              rFonts.setAttribute('w:hAnsi', runAscii);
              rFonts.setAttribute('w:eastAsia', targetLblFont);
              rFonts.setAttribute('w:cs', runAscii);
              if (!rFonts.parentNode) rPr.appendChild(rFonts);
            }
          }
        }

        // B. Column 1+: 填写值单元格 (顶格纯净左对齐，常规体，零方差)
        for (let cIdx = 1; cIdx < cells.length; cIdx++) {
          const cell = cells[cIdx];
          const ps = Array.from(cell.getElementsByTagNameNS(W_NS, 'p'));
          for (const p of ps) {
            const numPrs = Array.from(p.getElementsByTagNameNS(W_NS, 'numPr'));
            numPrs.forEach(n => n.parentNode?.removeChild(n));

            const pPr = p.getElementsByTagNameNS(W_NS, 'pPr')[0];
            if (pPr) {
              const ind = pPr.getElementsByTagNameNS(W_NS, 'ind')[0];
              if (ind) pPr.removeChild(ind);
            }

            const runs = Array.from(p.getElementsByTagNameNS(W_NS, 'r'));
            for (const run of runs) {
              const runText = (run.textContent || '').trim();
              if (!runText && !run.getElementsByTagNameNS(W_NS, 'drawing').length && !run.getElementsByTagNameNS(W_NS, 'br').length) {
                run.parentNode?.removeChild(run);
                continue;
              }
              let rPr = run.getElementsByTagNameNS(W_NS, 'rPr')[0] || doc.createElementNS(W_NS, 'w:rPr');
              if (!rPr.parentNode) run.insertBefore(rPr, run.firstChild);

              let sz = rPr.getElementsByTagNameNS(W_NS, 'sz')[0] || doc.createElementNS(W_NS, 'w:sz');
              sz.setAttribute('w:val', targetSz);
              if (!sz.parentNode) rPr.appendChild(sz);
              let szCs = rPr.getElementsByTagNameNS(W_NS, 'szCs')[0] || doc.createElementNS(W_NS, 'w:szCs');
              szCs.setAttribute('w:val', targetSz);
              if (!szCs.parentNode) rPr.appendChild(szCs);

              let rFonts = rPr.getElementsByTagNameNS(W_NS, 'rFonts')[0] || doc.createElementNS(W_NS, 'w:rFonts');
              rFonts.setAttribute('w:ascii', targetAscii);
              rFonts.setAttribute('w:hAnsi', targetAscii);
              rFonts.setAttribute('w:eastAsia', targetFont);
              rFonts.setAttribute('w:cs', targetAscii);
              if (!rFonts.parentNode) rPr.appendChild(rFonts);

              const isSubLabel = /^(预防措施|事故响应|安全储存|废弃处置|经口|吸入|经皮|物种|分类|结果|重复剂量中毒|病理变化|致畸形|致畸性|致畸|生育力|Oral|Inhalation|Dermal|Species|Classification|Result|Repeated dose toxicity|Pathological changes|Teratogenicity|Fertility|Prevention|Response|Storage|Disposal)[：:]?$/i.test(runText) || /^[：:]$/.test(runText);
              if (!isSubLabel) {
                const bs = Array.from(rPr.getElementsByTagNameNS(W_NS, 'b'));
                bs.forEach(b => rPr.removeChild(b));
                const bCss = Array.from(rPr.getElementsByTagNameNS(W_NS, 'bCs'));
                bCss.forEach(b => rPr.removeChild(b));
              }
            }
          }
        }
      } else {
        // 2.4 单列表格行 (cells.length === 1, 如 Section 2, 11, 15 等通栏行)
        const cell = cells[0];
        const ps = Array.from(cell.getElementsByTagNameNS(W_NS, 'p'));
        for (const p of ps) {
          const numPrs = Array.from(p.getElementsByTagNameNS(W_NS, 'numPr'));
          numPrs.forEach(n => n.parentNode?.removeChild(n));

          const pText = (p.textContent || '').trim();
          if (!pText) continue;

          // 匹配复合键值对 (如 "2.1 GHS危险性类别：非危险化学品" 或 "Signal word: None")
          const kvMatch = pText.match(/^(\\s*(?:(?:2\\.\\d+\\s*)?(?:GHS\\s*危险性类别|GHS\\s*分类|Classification of the substance or mixture|GHS\\s*Classification|GHS\\s*标签要素|Label elements|GHS\\s*Label\\s*Elements|危险性说明|危害性说明|Hazard\\s*statements?(?:\\s*\\([a-zA-Z0-9]+\\))?|防范说明|Precautionary\\s*statements?(?:\\s*\\([a-zA-Z0-9]+\\))?|其他危害|其他危险|Other\\s*hazards?)|(?:GHS\\s*)?(?:象形图|pictograms?)|(?:警告词|信号词|Signal\\s*word)|(?:必须列在标签上的有害成[份分]|Hazardous components which must be listed on the label)|(?:需要注意的物质|Substances?\\s*(?:of\\s*concern|to\\s*be\\s*noted))|(?:预防措施|事故响应|安全存储|安全储存|废弃处置|Prevention|Response|Storage|Disposal)))[:：]\\s*(.*)$/i);
          const s15Match = sectionNumber === 15 && pText.match(/^(\\s*(?:其它的规定|其它规定|其他规定|Other provisions|Other regulations|符合下列法规要求|Complies with the following regulations))[:：]\\s*(.*)$/i);

          if (kvMatch || s15Match) {
            const match = kvMatch || s15Match;
            const labelText = match[1] + (isEnglish ? ': ' : '：');
            const valText = match[2]?.trim() || '';

            const oldRuns = Array.from(p.getElementsByTagNameNS(W_NS, 'r'));
            oldRuns.forEach(r => p.removeChild(r));

            // Run 1: 标签 (加粗)
            const r1 = doc.createElementNS(W_NS, 'w:r');
            const rPr1 = doc.createElementNS(W_NS, 'w:rPr');
            rPr1.appendChild(doc.createElementNS(W_NS, 'w:b'));
            rPr1.appendChild(doc.createElementNS(W_NS, 'w:bCs'));
            const sz1 = doc.createElementNS(W_NS, 'w:sz');
            sz1.setAttribute('w:val', targetSz);
            rPr1.appendChild(sz1);
            const szCs1 = doc.createElementNS(W_NS, 'w:szCs');
            szCs1.setAttribute('w:val', targetSz);
            rPr1.appendChild(szCs1);
            const rf1 = doc.createElementNS(W_NS, 'w:rFonts');
            rf1.setAttribute('w:ascii', targetAscii);
            rf1.setAttribute('w:hAnsi', targetAscii);
            rf1.setAttribute('w:eastAsia', targetFont);
            rf1.setAttribute('w:cs', targetAscii);
            rPr1.appendChild(rf1);
            r1.appendChild(rPr1);
            const t1 = doc.createElementNS(W_NS, 'w:t');
            t1.textContent = labelText;
            r1.appendChild(t1);
            p.appendChild(r1);

            // Run 2: 填写值 (常规体)
            if (valText) {
              const r2 = doc.createElementNS(W_NS, 'w:r');
              const rPr2 = doc.createElementNS(W_NS, 'w:rPr');
              const sz2 = doc.createElementNS(W_NS, 'w:sz');
              sz2.setAttribute('w:val', targetSz);
              rPr2.appendChild(sz2);
              const szCs2 = doc.createElementNS(W_NS, 'w:szCs');
              szCs2.setAttribute('w:val', targetSz);
              rPr2.appendChild(szCs2);
              const rf2 = doc.createElementNS(W_NS, 'w:rFonts');
              rf2.setAttribute('w:ascii', targetAscii);
              rf2.setAttribute('w:hAnsi', targetAscii);
              rf2.setAttribute('w:eastAsia', targetFont);
              rf2.setAttribute('w:cs', targetAscii);
              rPr2.appendChild(rf2);
              r2.appendChild(rPr2);
              const t2 = doc.createElementNS(W_NS, 'w:t');
              t2.textContent = valText;
              r2.appendChild(t2);
              p.appendChild(r2);
            }
          } else {
            // 纯结构性标签行 (如 "2.2 GHS标签要素：" 或 "防范说明：") 或 纯值行
            const isPureLabel = (sectionNumber === 2 && /^(?:(?:2\\.\\d+\\s*)?(?:GHS\\s*危险性类别|GHS\\s*分类|Classification of the substance or mixture|GHS\\s*Classification|GHS\\s*标签要素|Label elements|GHS\\s*Label\\s*Elements|危险性说明|危害性说明|Hazard\\s*statements?|防范说明|Precautionary\\s*statements?|其他危害|其他危险|Other\\s*hazards?)|(?:GHS\\s*)?(?:象形图|pictograms?)|(?:警告词|信号词|Signal\\s*word)|(?:预防措施|事故响应|安全存储|安全储存|废弃处置|Prevention|Response|Storage|Disposal))[：:]?$/i.test(pText)) ||
              (sectionNumber === 15 && /^(?:其它的规定|其它规定|其他规定|Other provisions|符合下列法规要求|Complies with the following regulations)[：:]?$/i.test(pText)) ||
              (sectionNumber === 11 && /^(?:[^：\\n]+[:：]\\s*)$/.test(pText) && !/^(?:毒性|刺激性|急性毒性|Toxicity|Irritation|Acute toxicity)[：:]/i.test(pText));

            const runs = Array.from(p.getElementsByTagNameNS(W_NS, 'r'));
            for (const run of runs) {
              const runText = (run.textContent || '').trim();
              if (!runText && !run.getElementsByTagNameNS(W_NS, 'drawing').length && !run.getElementsByTagNameNS(W_NS, 'br').length) {
                run.parentNode?.removeChild(run);
                continue;
              }
              let rPr = run.getElementsByTagNameNS(W_NS, 'rPr')[0] || doc.createElementNS(W_NS, 'w:rPr');
              if (!rPr.parentNode) run.insertBefore(rPr, run.firstChild);

              let sz = rPr.getElementsByTagNameNS(W_NS, 'sz')[0] || doc.createElementNS(W_NS, 'w:sz');
              sz.setAttribute('w:val', targetSz);
              if (!sz.parentNode) rPr.appendChild(sz);
              let szCs = rPr.getElementsByTagNameNS(W_NS, 'szCs')[0] || doc.createElementNS(W_NS, 'w:szCs');
              szCs.setAttribute('w:val', targetSz);
              if (!szCs.parentNode) rPr.appendChild(szCs);

              let rFonts = rPr.getElementsByTagNameNS(W_NS, 'rFonts')[0] || doc.createElementNS(W_NS, 'w:rFonts');
              rFonts.setAttribute('w:ascii', targetAscii);
              rFonts.setAttribute('w:hAnsi', targetAscii);
              rFonts.setAttribute('w:eastAsia', targetFont);
              rFonts.setAttribute('w:cs', targetAscii);
              if (!rFonts.parentNode) rPr.appendChild(rFonts);

              if (isPureLabel) {
                let b = rPr.getElementsByTagNameNS(W_NS, 'w:b')[0] || doc.createElementNS(W_NS, 'w:b');
                if (!b.parentNode) rPr.appendChild(b);
                let bCs = rPr.getElementsByTagNameNS(W_NS, 'w:bCs')[0] || doc.createElementNS(W_NS, 'w:bCs');
                if (!bCs.parentNode) rPr.appendChild(bCs);
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
          }
        }
      }

      // 2.5 符号排版规范化（≥/≤ 统一、单位空格、标点纯净）
      for (const cell of cells) {
        const tNodes = Array.from(cell.getElementsByTagNameNS(W_NS, 't'));
        for (const t of tNodes) {
          if (t.textContent) {
            let tc = t.textContent
              .replace(/≧/g, '≥')
              .replace(/≦/g, '≤')
              .replace(/(\\d+(?:\\.\\d+)?)\\s*(mm|min)\\b/gi, '$1 $2')
              .replace(/\\b(min|mm)\\.\\s*$/gi, '$1');
            if (isEnglish) {
              tc = tc.replace(/；/g, '; ');
              tc = tc.replace(/([.!?\\)])([A-Za-z])/g, '$1 $2');
              if (tc.length > 15 && !/[.!?:]$/.test(tc) && !/\\b(?:min|mm|CAS|EC|No|N\\/A|None)\\.?$/i.test(tc)) {
                tc = tc + '.';
              }
            } else {
              tc = tc.replace(/;\\s*|；\\s*/g, '；');
              tc = tc.replace(/\\.$/, '');
            }
            t.textContent = tc;
          }
        }
      }
    }
  }
}
// @ANTIGRAVITY_INVARIANT_LOCK_END`;

// Combine with unchanged helper functions in lines 28-294
const headerPart = origContent.slice(0, origContent.indexOf('export const MSDS_DESIGN_TOKENS'));
const middlePart = origContent.slice(
  origContent.indexOf('// @ANTIGRAVITY_INVARIANT_LOCK_END') + '// @ANTIGRAVITY_INVARIANT_LOCK_END'.length,
  origContent.indexOf('// @ANTIGRAVITY_INVARIANT_LOCK_START: APPLY_GLOBAL_TYPOGRAPHY_PROJECTION_IMMUTABLE')
);

const fullProposed = headerPart + proposedTokens + middlePart + proposedProjection + '\n';
fs.writeFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/proposed_universal_primitives.js', fullProposed, 'utf8');
console.log('Saved proposed file, length:', fullProposed.length);
