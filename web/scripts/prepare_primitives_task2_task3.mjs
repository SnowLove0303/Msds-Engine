import fs from 'fs';

let code = fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/universal-editor-primitives.js', 'utf8');

// Target section in applyGlobalTypographyProjection
const oldBlock = `              // 折行对齐规范 (REQ-05): 标签换行第二行首字必须永远与标签第一行首字对齐
              const pText = (p.textContent || '').trim();
              const hasSeq = /^(\\d+\\.\\d+(?:\\.\\d+)?)\\b/.test(pText);
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
              } else {
                if (ind) {
                  const fl = ind.getAttribute('w:firstLine');
                  if (fl && fl !== '0') {
                    ind.removeAttribute('w:firstLine');
                    ind.removeAttribute('w:firstLineChars');
                  }
                  if (ind.getAttribute('w:hanging')) {
                    ind.removeAttribute('w:hanging');
                    ind.removeAttribute('w:hangingChars');
                  }
                }
              }`;

const newBlock = `              // 9.1 外观黄金几何标尺与折行对齐规范 (REQ-GOLDEN-ANCHOR, REQ-SUB-PARENT-ALIGN, REQ-WRAP-VERTICAL-ALIGN)
              const pText = (p.textContent || '').trim();
              const mSeq = pText.match(/^(\\d+\\.\\d+(?:\\.\\d+)?)\\s*(.*)$/);
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
                  const seqSz = !isEnglish ? (seqStr.length >= 5 ? '20' : '21') : (seqStr.length >= 5 ? '18' : '19');
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
              }`;

if (!code.includes(oldBlock)) {
  console.error('oldBlock not found in universal-editor-primitives.js');
  process.exit(1);
}
code = code.replace(oldBlock, newBlock);

// Sub-value rightward indentation in value cells
const oldValueBlock = `      // 对所有值单元格（单列描述行或多列中 c >= 1 的列）强制投影标准 Design Tokens
      const startCol = (cells.length === 1) ? 0 : 1;
      for (let cIdx = startCol; cIdx < cells.length; cIdx++) {
        const cell = cells[cIdx];
        const cellText = (cell.textContent || '').trim();
        // 跳过固定表头字样
        if (/^(?:CAS编号|含量%（w\\/w）|CAS NO\\.|Concentration % \\(w\\/w\\)|依据|类型|数值|Basis|Type|Value)$/i.test(cellText)) continue;

        // 1. 清理段落级 pPr -> rPr，消除从模板继承的加粗与残留字号污染
        const ps = Array.from(cell.getElementsByTagNameNS(W_NS, 'p'));
        for (const p of ps) {`;

const newValueBlock = `      // 判定当前行是否属于子级标签行 (REQ-SUBVAL-RIGHT-INDENT)
      const labelText0 = (cells.length > 1 ? cells[0].textContent || '' : '').trim();
      const isSubLabelRow = (cells.length > 1) && !/^(\\d+\\.\\d+(?:\\.\\d+)?)\\b/.test(labelText0) && !/^(?:化学品名称|CAS编号|物质|依据|Substance|Basis)/i.test(labelText0);

      // 对所有值单元格（单列描述行或多列中 c >= 1 的列）强制投影标准 Design Tokens
      const startCol = (cells.length === 1) ? 0 : 1;
      for (let cIdx = startCol; cIdx < cells.length; cIdx++) {
        const cell = cells[cIdx];
        const cellText = (cell.textContent || '').trim();
        // 跳过固定表头字样
        if (/^(?:CAS编号|含量%（w\\/w）|CAS NO\\.|Concentration % \\(w\\/w\\)|依据|类型|数值|Basis|Type|Value)$/i.test(cellText)) continue;

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
          }
`;

if (!code.includes(oldValueBlock)) {
  console.error('oldValueBlock not found in universal-editor-primitives.js');
  process.exit(1);
}
code = code.replace(oldValueBlock, newValueBlock);

fs.writeFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/scripts/universal_primitives_proposed2.js', code, 'utf8');
console.log('universal_primitives_proposed2.js prepared successfully!');
