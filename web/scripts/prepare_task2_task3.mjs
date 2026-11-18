import fs from 'fs';

let pCode = fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/pipeline-engine.js', 'utf8');

// 1. rebuildUnifiedLabelRun: Replace static spaces with <w:tab/> and adaptive sequence size
const oldRebuild = `export function rebuildUnifiedLabelRun(p, seqStr, labelText, { font, asciiFont, sizeVal, bold }, W_NS) {
  const existingRuns = Array.from(p.getElementsByTagNameNS(W_NS, 'r'));
  existingRuns.forEach(r => p.removeChild(r));
  const numPrs = Array.from(p.getElementsByTagNameNS(W_NS, 'numPr'));
  numPrs.forEach(n => n.parentNode?.removeChild(n));
  const doc = p.ownerDocument;

  if (seqStr) {
    const rSeq = doc.createElementNS(W_NS, 'w:r');
    const rPrSeq = doc.createElementNS(W_NS, 'w:rPr');
    applyRunProps(rPrSeq, { font: asciiFont || font, asciiFont: asciiFont || font, sizeVal, bold }, W_NS);
    rSeq.appendChild(rPrSeq);
    const tSeq = doc.createElementNS(W_NS, 'w:t');
    tSeq.setAttribute('xml:space', 'preserve');
    tSeq.textContent = \`\${seqStr}  \`;
    rSeq.appendChild(tSeq);
    p.appendChild(rSeq);
  }

  if (labelText) {
    const rLbl = doc.createElementNS(W_NS, 'w:r');
    const rPrLbl = doc.createElementNS(W_NS, 'w:rPr');
    applyRunProps(rPrLbl, { font, asciiFont: asciiFont || font, sizeVal, bold }, W_NS);
    rLbl.appendChild(rPrLbl);
    const tLbl = doc.createElementNS(W_NS, 'w:t');
    tLbl.textContent = labelText;
    rLbl.appendChild(tLbl);
    p.appendChild(rLbl);
  }
}`;

const newRebuild = `export function rebuildUnifiedLabelRun(p, seqStr, labelText, { font, asciiFont, sizeVal, bold }, W_NS) {
  const existingRuns = Array.from(p.getElementsByTagNameNS(W_NS, 'r'));
  existingRuns.forEach(r => p.removeChild(r));
  const numPrs = Array.from(p.getElementsByTagNameNS(W_NS, 'numPr'));
  numPrs.forEach(n => n.parentNode?.removeChild(n));
  const doc = p.ownerDocument;

  if (seqStr) {
    const rSeq = doc.createElementNS(W_NS, 'w:r');
    const rPrSeq = doc.createElementNS(W_NS, 'w:rPr');
    // 黄金标尺适配：5 字符序号（如 11.10~11.16）字号自适应为 10pt (sz=20)，确保宽度严格 < 420 dxa 制表停靠线
    let seqSz = sizeVal;
    if (font === '宋体') {
      seqSz = (seqStr.length >= 5) ? '20' : '21';
    } else {
      seqSz = (seqStr.length >= 5) ? '18' : '19';
    }
    applyRunProps(rPrSeq, { font: asciiFont || (font === '宋体' ? 'Times New Roman' : 'Arial'), asciiFont: asciiFont || (font === '宋体' ? 'Times New Roman' : 'Arial'), sizeVal: seqSz, bold }, W_NS);
    rSeq.appendChild(rPrSeq);
    const tSeq = doc.createElementNS(W_NS, 'w:t');
    tSeq.textContent = seqStr;
    rSeq.appendChild(tSeq);

    // 黄金基准锚点：注入法定 <w:tab/>，配合 420 dxa 悬挂缩进，强制正文首字严格停靠在 420 dxa (REQ-GOLDEN-ANCHOR)
    const tab = doc.createElementNS(W_NS, 'w:tab');
    rSeq.appendChild(tab);
    p.appendChild(rSeq);
  }

  if (labelText) {
    const rLbl = doc.createElementNS(W_NS, 'w:r');
    const rPrLbl = doc.createElementNS(W_NS, 'w:rPr');
    applyRunProps(rPrLbl, { font, asciiFont: asciiFont || font, sizeVal, bold }, W_NS);
    rLbl.appendChild(rPrLbl);
    const tLbl = doc.createElementNS(W_NS, 'w:t');
    tLbl.textContent = labelText;
    rLbl.appendChild(tLbl);
    p.appendChild(rLbl);
  }
}`;

if (!pCode.includes(oldRebuild)) {
  console.error('oldRebuild not found in pipeline-engine.js');
  process.exit(1);
}
pCode = pCode.replace(oldRebuild, newRebuild);

// 2. formatEnglishLabelCell: Unify indent to 420 and use rebuildUnifiedLabelRun with <w:tab/>
const oldEnLabel = `  // 方案 2：Section 11 包含 11.10（5字符宽约452 dxa），悬挂缩进统一采用 565 dxa，防止制表符弹飞；其余章节采用 420 dxa
  const indent = (sectionNumber === 11 ? '565' : '420');`;
const newEnLabel = `  // 9.1 外观黄金几何标尺：全 16 章节父级标签统一采用 420 dxa 悬挂缩进与 <w:tab/> 激光对齐 (REQ-GOLDEN-ANCHOR)
  const indent = '420';`;
if (!pCode.includes(oldEnLabel)) {
  console.error('oldEnLabel not found in pipeline-engine.js');
  process.exit(1);
}
pCode = pCode.replace(oldEnLabel, newEnLabel);

// 3. formatEnglishLabelCell hasSeq branch
const oldEnBranch = `  if (hasSeq) {
    applyHangingIndentToP(firstP, indent, indent, W_NS);
    rebuildTabbedLabelWithTypography(firstP, seqStr, cleanLabel, {
      font: 'Arial',
      sizeVal: '19', // 9.5pt
      bold: true
    }, W_NS);
  } else {
    // 第一列无序号标签（如 Chemical category:、Recommendation:、PPE 各子项等）：
    // 强制统一应用 indent (420/565 dxa) 左缩进，使其文字首字母与有序号标签的正文首字母严格在同一垂直基准线上对齐，消除锯齿！
    applyLeftIndentToP(firstP, indent, W_NS);
    rebuildRunsWithTypography(firstP, cleanLabel, {
      font: 'Arial',
      sizeVal: '19', // 英文版全篇统一为 9.5pt (sz="19")，彻底消灭逆向膨胀！
      bold: true
    }, W_NS);
  }`;

const newEnBranch = `  if (hasSeq) {
    applyHangingIndentToP(firstP, '420', '420', W_NS);
    rebuildUnifiedLabelRun(firstP, seqStr, cleanLabel, {
      font: 'Arial',
      asciiFont: 'Arial',
      sizeVal: '19', // 9.5pt
      bold: true
    }, W_NS);
  } else {
    // 第一列无序号子级标签（如 Chemical category:、Recommendation:、PPE 各子项等）：
    // 强制统一应用 420 dxa 左缩进，使其首字与有序号父级标签的正文首字严格垂直共线 (REQ-SUB-PARENT-ALIGN)
    applyLeftIndentToP(firstP, '420', W_NS);
    rebuildUnifiedLabelRun(firstP, '', cleanLabel, {
      font: 'Arial',
      asciiFont: 'Arial',
      sizeVal: '19',
      bold: true
    }, W_NS);
  }`;

if (!pCode.includes(oldEnBranch)) {
  console.error('oldEnBranch not found in pipeline-engine.js');
  process.exit(1);
}
pCode = pCode.replace(oldEnBranch, newEnBranch);

// 4. In Section 8 English
const oldS8En = `        if (/^8\\.1\\b/i.test(rowText)) {
          const c0 = cells[0];
          cleanTabsInNode(c0, W_NS);
          const p = c0.getElementsByTagNameNS(W_NS, 'p')[0];
          if (p) {
            removeHangingIndentFromP(p, W_NS);
            setParagraphAlign(p, 'left', W_NS);
            rebuildRunsWithTypography(p, '8.1  Exposure controls:', { font: 'Arial', sizeVal: '21', bold: true }, W_NS);
          }
          if (cells.length > 1) {
            for (let ci = 1; ci < cells.length; ci++) formatValueCell(cells[ci], W_NS);
          }
          continue;
        }
        if (/^8\\.2\\b/i.test(rowText)) {
          const c0 = cells[0];
          cleanTabsInNode(c0, W_NS);
          const p0 = c0.getElementsByTagNameNS(W_NS, 'p')[0];
          if (p0) {
            removeHangingIndentFromP(p0, W_NS);
            setParagraphAlign(p0, 'left', W_NS);
            const m = (c0.textContent || '').match(/^8\\.2\\s*(.*?)(?:[:：])?$/);
            const subTitle = (m && m[1].trim()) ? m[1].trim() : 'Engineering controls';
            rebuildRunsWithTypography(p0, \`8.2  \${subTitle}:\`, { font: 'Arial', sizeVal: '21', bold: true }, W_NS);
          }
          if (cells.length > 1) {
            for (let ci = 1; ci < cells.length; ci++) formatValueCell(cells[ci], W_NS);
          }
          continue;
        }`;

const newS8En = `        if (/^8\\.1\\b/i.test(rowText)) {
          const c0 = cells[0];
          cleanTabsInNode(c0, W_NS);
          const p = c0.getElementsByTagNameNS(W_NS, 'p')[0];
          if (p) {
            applyHangingIndentToP(p, '420', '420', W_NS);
            setParagraphAlign(p, 'left', W_NS);
            rebuildUnifiedLabelRun(p, '8.1', 'Exposure controls:', { font: 'Arial', asciiFont: 'Arial', sizeVal: '19', bold: true }, W_NS);
          }
          if (cells.length > 1) {
            for (let ci = 1; ci < cells.length; ci++) formatValueCell(cells[ci], W_NS);
          }
          continue;
        }
        if (/^8\\.2\\b/i.test(rowText)) {
          const c0 = cells[0];
          cleanTabsInNode(c0, W_NS);
          const p0 = c0.getElementsByTagNameNS(W_NS, 'p')[0];
          if (p0) {
            applyHangingIndentToP(p0, '420', '420', W_NS);
            setParagraphAlign(p0, 'left', W_NS);
            const m = (c0.textContent || '').match(/^8\\.2\\s*(.*?)(?:[:：])?$/);
            const subTitle = (m && m[1].trim()) ? m[1].trim() : 'Engineering controls';
            rebuildUnifiedLabelRun(p0, '8.2', \`\${subTitle}:\`, { font: 'Arial', asciiFont: 'Arial', sizeVal: '19', bold: true }, W_NS);
          }
          if (cells.length > 1) {
            for (let ci = 1; ci < cells.length; ci++) formatValueCell(cells[ci], W_NS);
          }
          continue;
        }`;

if (!pCode.includes(oldS8En)) {
  console.error('oldS8En not found in pipeline-engine.js');
  process.exit(1);
}
pCode = pCode.replace(oldS8En, newS8En);

// 5. In Section 8 Chinese: 8.1 暴露控制 / 控制参数
const oldS8Cn = `  // 2. Section 8.1 题头行与 Section 8.2 工程控制格式规范
  const s8Rec = eng.records.find(r => r.sectionNumber === 8);
  if (s8Rec && s8Rec.rows.length >= 2) {
    const r1 = s8Rec.rows[1];
    const c0 = r1.cells[0]?.node;
    if (c0) {
      const runs = Array.from(c0.getElementsByTagNameNS(W_NS, 'r'));
      if (runs.length >= 1) {
        let r0Pr = runs[0].getElementsByTagNameNS(W_NS, 'rPr')[0] || doc.createElementNS(W_NS, 'w:rPr');
        if (!runs[0].getElementsByTagNameNS(W_NS, 'rPr')[0]) runs[0].insertBefore(r0Pr, runs[0].firstChild);
        let b = r0Pr.getElementsByTagNameNS(W_NS, 'b')[0] || doc.createElementNS(W_NS, 'w:b');
        if (!r0Pr.getElementsByTagNameNS(W_NS, 'b')[0]) r0Pr.appendChild(b);
        let bCs = r0Pr.getElementsByTagNameNS(W_NS, 'bCs')[0] || doc.createElementNS(W_NS, 'w:bCs');
        if (!r0Pr.getElementsByTagNameNS(W_NS, 'bCs')[0]) r0Pr.appendChild(bCs);
        let sz = r0Pr.getElementsByTagNameNS(W_NS, 'sz')[0] || doc.createElementNS(W_NS, 'w:sz');
        sz.setAttribute('w:val', isEn ? '19' : '24');
        if (!r0Pr.getElementsByTagNameNS(W_NS, 'sz')[0]) r0Pr.appendChild(sz);
        let szCs = r0Pr.getElementsByTagNameNS(W_NS, 'szCs')[0] || doc.createElementNS(W_NS, 'w:szCs');
        szCs.setAttribute('w:val', isEn ? '19' : '24');
        if (!r0Pr.getElementsByTagNameNS(W_NS, 'szCs')[0]) r0Pr.appendChild(szCs);
        let rf = r0Pr.getElementsByTagNameNS(W_NS, 'rFonts')[0] || doc.createElementNS(W_NS, 'w:rFonts');
        rf.setAttribute('w:ascii', 'Times New Roman');
        rf.setAttribute('w:hAnsi', 'Times New Roman');
        if (!r0Pr.getElementsByTagNameNS(W_NS, 'rFonts')[0]) r0Pr.appendChild(rf);
      }
      if (runs.length >= 2) {
        let r1Pr = runs[1].getElementsByTagNameNS(W_NS, 'rPr')[0] || doc.createElementNS(W_NS, 'w:rPr');
        if (!runs[1].getElementsByTagNameNS(W_NS, 'rPr')[0]) runs[1].insertBefore(r1Pr, runs[1].firstChild);
        let b = r1Pr.getElementsByTagNameNS(W_NS, 'b')[0] || doc.createElementNS(W_NS, 'w:b');
        if (!r1Pr.getElementsByTagNameNS(W_NS, 'b')[0]) r1Pr.appendChild(b);
        let bCs = r1Pr.getElementsByTagNameNS(W_NS, 'bCs')[0] || doc.createElementNS(W_NS, 'w:bCs');
        if (!r1Pr.getElementsByTagNameNS(W_NS, 'bCs')[0]) r1Pr.appendChild(bCs);
        let sz = r1Pr.getElementsByTagNameNS(W_NS, 'sz')[0] || doc.createElementNS(W_NS, 'w:sz');
        sz.setAttribute('w:val', isEn ? '19' : '24');
        if (!r1Pr.getElementsByTagNameNS(W_NS, 'sz')[0]) r1Pr.appendChild(sz);
        let szCs = r1Pr.getElementsByTagNameNS(W_NS, 'szCs')[0] || doc.createElementNS(W_NS, 'w:szCs');
        szCs.setAttribute('w:val', isEn ? '19' : '24');
        if (!r1Pr.getElementsByTagNameNS(W_NS, 'szCs')[0]) r1Pr.appendChild(szCs);
      }
    }
  }`;

const newS8Cn = `  // 2. Section 8.1 题头行与 Section 8.2 工程控制格式规范 (9.1 外观黄金基准对齐 REQ-GOLDEN-ANCHOR)
  const s8Rec = eng.records.find(r => r.sectionNumber === 8);
  if (s8Rec && s8Rec.rows.length >= 2) {
    const r1 = s8Rec.rows[1];
    const c0 = r1.cells[0]?.node;
    if (c0) {
      const p = c0.getElementsByTagNameNS(W_NS, 'p')[0];
      if (p) {
        const text = (p.textContent || '').trim();
        const m = text.match(/^8\\.1\\s*(.*)$/);
        const lbl = (m && m[1]) ? m[1].replace(/^[:：]/, '').trim() : (isEn ? 'Exposure controls:' : '控制参数：');
        applyHangingIndentToP(p, '420', '420', W_NS);
        rebuildUnifiedLabelRun(p, '8.1', lbl.endsWith('：') || lbl.endsWith(':') ? lbl : (lbl + (isEn ? ':' : '：')), {
          font: isEn ? 'Arial' : '宋体',
          asciiFont: isEn ? 'Arial' : 'Times New Roman',
          sizeVal: isEn ? '19' : '24',
          bold: true
        }, W_NS);
      }
    }
  }`;

if (!pCode.includes(oldS8Cn)) {
  console.error('oldS8Cn not found in pipeline-engine.js');
  process.exit(1);
}
pCode = pCode.replace(oldS8Cn, newS8Cn);

fs.writeFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/scripts/pipeline_engine_proposed2.js', pCode, 'utf8');
console.log('pipeline_engine_proposed2.js prepared successfully!');
