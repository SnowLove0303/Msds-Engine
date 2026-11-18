import fs from 'fs';

let code = fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/pipeline-engine.js', 'utf8');

// 1. Hand protection at line 2439
const oldHp1 = `            inds.forEach(ind => {
              ind.setAttributeNS(W_NS, 'w:left', '420');
              ind.removeAttributeNS(W_NS, 'w:firstLine');
              ind.removeAttributeNS(W_NS, 'w:firstLineChars');
              ind.removeAttributeNS(W_NS, 'w:hanging');
              ind.removeAttributeNS(W_NS, 'w:hangingChars');
            });`;

const newHp1 = `            inds.forEach(ind => {
              ind.setAttributeNS(W_NS, 'w:left', '420');
              ind.removeAttributeNS(W_NS, 'w:firstLine');
              ind.removeAttributeNS(W_NS, 'w:firstLineChars');
              ind.removeAttributeNS(W_NS, 'w:hanging');
              ind.removeAttributeNS(W_NS, 'w:hangingChars');
              ind.removeAttributeNS(W_NS, 'w:leftChars');
              ind.removeAttribute('w:leftChars');
              ind.setAttributeNS(W_NS, 'w:leftChars', '0');
            });`;

if (!code.includes(oldHp1)) {
  console.error('oldHp1 not found in pipeline-engine.js');
  process.exit(1);
}
code = code.replace(oldHp1, newHp1);

// 2. Hand protection at line 3977
const oldHp2 = `        inds.forEach(ind => {
          ind.setAttribute('w:left', '420');
          ind.removeAttribute('w:firstLine');
          ind.removeAttribute('w:firstLineChars');
          ind.removeAttribute('w:hanging');
          ind.removeAttribute('w:hangingChars');
        });`;

const newHp2 = `        inds.forEach(ind => {
          ind.setAttribute('w:left', '420');
          ind.removeAttribute('w:firstLine');
          ind.removeAttribute('w:firstLineChars');
          ind.removeAttribute('w:hanging');
          ind.removeAttribute('w:hangingChars');
          ind.removeAttribute('w:leftChars');
          ind.removeAttributeNS(W_NS, 'leftChars');
          ind.setAttributeNS(W_NS, 'w:leftChars', '0');
        });`;

if (!code.includes(oldHp2)) {
  console.error('oldHp2 not found in pipeline-engine.js');
  process.exit(1);
}
code = code.replace(oldHp2, newHp2);

// 3. Section 4 & Section 5 loops
const oldSec45 = `  // 4. 全局中文标签单元格字号均一性加固 (INV-FONT-UNIFORMITY, DEF-11):
  // 统一所有章节第 0 列标签中运行区为法定小四号 12pt (sz="24")，彻底清除序号 sz="21" 混排断层
  if (!isEn) {
    const allTables = Array.from(doc.getElementsByTagNameNS(W_NS, 'tbl'));
    for (const tbl of allTables) {
      const tblText = tbl.textContent || '';
      if (tblText.includes('物理和化学特性') || tblText.includes('理化特性')) continue; // G-38 专属激光垂线对齐豁免 (序号 10.5pt, 标签 12pt)
      const trs = Array.from(tbl.getElementsByTagNameNS(W_NS, 'tr'));
      for (let rIdx = 1; rIdx < trs.length; rIdx++) {
        const c0 = trs[rIdx].getElementsByTagNameNS(W_NS, 'tc')[0];
        if (!c0) continue;
        const runs = Array.from(c0.getElementsByTagNameNS(W_NS, 'r'));
        for (const run of runs) {
          let rPr = run.getElementsByTagNameNS(W_NS, 'rPr')[0] || doc.createElementNS(W_NS, 'w:rPr');
          if (!run.getElementsByTagNameNS(W_NS, 'rPr')[0]) run.insertBefore(rPr, run.firstChild);
          let sz = rPr.getElementsByTagNameNS(W_NS, 'sz')[0] || doc.createElementNS(W_NS, 'w:sz');
          sz.setAttribute('w:val', '24');
          if (!rPr.getElementsByTagNameNS(W_NS, 'sz')[0]) rPr.appendChild(sz);
          let szCs = rPr.getElementsByTagNameNS(W_NS, 'szCs')[0] || doc.createElementNS(W_NS, 'w:szCs');
          szCs.setAttribute('w:val', '24');
          if (!rPr.getElementsByTagNameNS(W_NS, 'szCs')[0]) rPr.appendChild(szCs);
        }
        // 同时清理段落级 pPr/rPr 中可能残留的 sz="21"
        const ps = Array.from(c0.getElementsByTagNameNS(W_NS, 'p'));
        for (const p of ps) {
          const pPr = p.getElementsByTagNameNS(W_NS, 'pPr')[0];
          if (pPr) {
            const pRPr = pPr.getElementsByTagNameNS(W_NS, 'rPr')[0];
            if (pRPr) {
              const szs = pRPr.getElementsByTagNameNS(W_NS, 'sz');
              for (const s of Array.from(szs)) s.setAttribute('w:val', '24');
              const szCss = pRPr.getElementsByTagNameNS(W_NS, 'szCs');
              for (const s of Array.from(szCss)) s.setAttribute('w:val', '24');
            }
          }
        }
      }
    }
  }

  // 5. 全局英文标签单元格字号均一性加固 (INV-FONT-UNIFORMITY, DEF-12):
  // 统一所有章节第 0 列小标签为法定五号 9.5pt (sz="19") Arial 加粗，彻底清除 12pt (sz="24") 异常放大
  if (isEn) {
    const allTables = Array.from(doc.getElementsByTagNameNS(W_NS, 'tbl'));
    for (const tbl of allTables) {
      const trs = Array.from(tbl.getElementsByTagNameNS(W_NS, 'tr'));
      for (let rIdx = 1; rIdx < trs.length; rIdx++) {
        const c0 = trs[rIdx].getElementsByTagNameNS(W_NS, 'tc')[0];
        if (!c0) continue;
        const c0Text = (c0.textContent || '').trim();
        // 豁免 Section 8 顶级题头
        if (/^8\.\s*EXPOSURE|^8\.1\s*Exposure controls/i.test(c0Text)) continue;

        const runs = Array.from(c0.getElementsByTagNameNS(W_NS, 'r'));
        for (const run of runs) {
          let rPr = run.getElementsByTagNameNS(W_NS, 'rPr')[0] || doc.createElementNS(W_NS, 'w:rPr');
          if (!run.getElementsByTagNameNS(W_NS, 'rPr')[0]) run.insertBefore(rPr, run.firstChild);
          let sz = rPr.getElementsByTagNameNS(W_NS, 'sz')[0] || doc.createElementNS(W_NS, 'w:sz');
          sz.setAttribute('w:val', '19');
          if (!rPr.getElementsByTagNameNS(W_NS, 'sz')[0]) rPr.appendChild(sz);
          let szCs = rPr.getElementsByTagNameNS(W_NS, 'szCs')[0] || doc.createElementNS(W_NS, 'w:szCs');
          szCs.setAttribute('w:val', '19');
          if (!rPr.getElementsByTagNameNS(W_NS, 'szCs')[0]) rPr.appendChild(szCs);

          let rFonts = rPr.getElementsByTagNameNS(W_NS, 'rFonts')[0] || doc.createElementNS(W_NS, 'w:rFonts');
          rFonts.setAttribute('w:ascii', 'Arial');
          rFonts.setAttribute('w:hAnsi', 'Arial');
          rFonts.setAttribute('w:eastAsia', 'Arial');
          rFonts.setAttribute('w:cs', 'Arial');
          if (!rPr.getElementsByTagNameNS(W_NS, 'rFonts')[0]) rPr.appendChild(rFonts);
        }
        // 同时清理段落级 pPr/rPr 中可能残留的 sz="24"
        const ps = Array.from(c0.getElementsByTagNameNS(W_NS, 'p'));
        for (const p of ps) {
          const pPr = p.getElementsByTagNameNS(W_NS, 'pPr')[0];
          if (pPr) {
            const pRPr = pPr.getElementsByTagNameNS(W_NS, 'rPr')[0];
            if (pRPr) {
              const szs = pRPr.getElementsByTagNameNS(W_NS, 'sz');
              for (const s of Array.from(szs)) s.setAttribute('w:val', '19');
              const szCss = pRPr.getElementsByTagNameNS(W_NS, 'szCs');
              for (const s of Array.from(szCss)) s.setAttribute('w:val', '19');
            }
          }
        }
      }
    }
  }`;

const newSec45 = `  // 4. 全局中文标签单元格字号均一性加固 (INV-FONT-UNIFORMITY, DEF-11):
  // 统一所有章节第 0 列标签中运行区为法定小四号 12pt (sz="24")，序号为 10.5pt (sz="21") / 9.5pt (sz="19")
  if (!isEn) {
    const allTables = Array.from(doc.getElementsByTagNameNS(W_NS, 'tbl'));
    for (const tbl of allTables) {
      const tblText = tbl.textContent || '';
      if (tblText.includes('物理和化学特性') || tblText.includes('理化特性')) continue; // G-38 专属激光垂线对齐豁免 (序号 10.5pt, 标签 12pt)
      const trs = Array.from(tbl.getElementsByTagNameNS(W_NS, 'tr'));
      for (let rIdx = 1; rIdx < trs.length; rIdx++) {
        const c0 = trs[rIdx].getElementsByTagNameNS(W_NS, 'tc')[0];
        if (!c0) continue;
        const runs = Array.from(c0.getElementsByTagNameNS(W_NS, 'r'));
        for (const run of runs) {
          const runText = (run.textContent || '').trim();
          const hasTab = run.getElementsByTagNameNS(W_NS, 'tab').length > 0 || run.getElementsByTagName('tab').length > 0;
          const isSeqRun = hasTab || /^(\\d+\\.\\d+(?:\\.\\d+)?)\\s*$/.test(runText);
          const targetSz = isSeqRun ? ((runText.length >= 5) ? '19' : '21') : '24';

          let rPr = run.getElementsByTagNameNS(W_NS, 'rPr')[0] || doc.createElementNS(W_NS, 'w:rPr');
          if (!run.getElementsByTagNameNS(W_NS, 'rPr')[0]) run.insertBefore(rPr, run.firstChild);
          let sz = rPr.getElementsByTagNameNS(W_NS, 'sz')[0] || doc.createElementNS(W_NS, 'w:sz');
          sz.setAttribute('w:val', targetSz);
          if (!rPr.getElementsByTagNameNS(W_NS, 'sz')[0]) rPr.appendChild(sz);
          let szCs = rPr.getElementsByTagNameNS(W_NS, 'szCs')[0] || doc.createElementNS(W_NS, 'w:szCs');
          szCs.setAttribute('w:val', targetSz);
          if (!rPr.getElementsByTagNameNS(W_NS, 'szCs')[0]) rPr.appendChild(szCs);
        }
        // 清理 leftChars 污染
        const inds = Array.from(c0.getElementsByTagNameNS(W_NS, 'ind'));
        inds.forEach(ind => {
          if (ind.getAttribute('w:left') === '420') {
            ind.removeAttribute('w:leftChars');
            ind.removeAttributeNS(W_NS, 'leftChars');
            ind.setAttributeNS(W_NS, 'w:leftChars', '0');
          }
        });
      }
    }
  }

  // 5. 全局英文标签单元格字号均一性加固 (INV-FONT-UNIFORMITY, DEF-12):
  // 统一所有章节第 0 列小标签为法定五号 9.5pt (sz="19") Arial 加粗，序号为 9pt (sz="18") / 7.5pt (sz="15")
  if (isEn) {
    const allTables = Array.from(doc.getElementsByTagNameNS(W_NS, 'tbl'));
    for (const tbl of allTables) {
      const trs = Array.from(tbl.getElementsByTagNameNS(W_NS, 'tr'));
      for (let rIdx = 1; rIdx < trs.length; rIdx++) {
        const c0 = trs[rIdx].getElementsByTagNameNS(W_NS, 'tc')[0];
        if (!c0) continue;
        const c0Text = (c0.textContent || '').trim();
        // 豁免 Section 8 顶级题头
        if (/^8\\.\\s*EXPOSURE|^8\\.1\\s*Exposure controls/i.test(c0Text)) continue;

        const runs = Array.from(c0.getElementsByTagNameNS(W_NS, 'r'));
        for (const run of runs) {
          const runText = (run.textContent || '').trim();
          const hasTab = run.getElementsByTagNameNS(W_NS, 'tab').length > 0 || run.getElementsByTagName('tab').length > 0;
          const isSeqRun = hasTab || /^(\\d+\\.\\d+(?:\\.\\d+)?)\\s*$/.test(runText);
          const targetSz = isSeqRun ? ((runText.length >= 5) ? '15' : '18') : '19';

          let rPr = run.getElementsByTagNameNS(W_NS, 'rPr')[0] || doc.createElementNS(W_NS, 'w:rPr');
          if (!run.getElementsByTagNameNS(W_NS, 'rPr')[0]) run.insertBefore(rPr, run.firstChild);
          let sz = rPr.getElementsByTagNameNS(W_NS, 'sz')[0] || doc.createElementNS(W_NS, 'w:sz');
          sz.setAttribute('w:val', targetSz);
          if (!rPr.getElementsByTagNameNS(W_NS, 'sz')[0]) rPr.appendChild(sz);
          let szCs = rPr.getElementsByTagNameNS(W_NS, 'szCs')[0] || doc.createElementNS(W_NS, 'w:szCs');
          szCs.setAttribute('w:val', targetSz);
          if (!rPr.getElementsByTagNameNS(W_NS, 'szCs')[0]) rPr.appendChild(szCs);

          let rFonts = rPr.getElementsByTagNameNS(W_NS, 'rFonts')[0] || doc.createElementNS(W_NS, 'w:rFonts');
          rFonts.setAttribute('w:ascii', 'Arial');
          rFonts.setAttribute('w:hAnsi', 'Arial');
          rFonts.setAttribute('w:eastAsia', 'Arial');
          rFonts.setAttribute('w:cs', 'Arial');
          if (!rPr.getElementsByTagNameNS(W_NS, 'rFonts')[0]) rPr.appendChild(rFonts);
        }
        // 清理 leftChars 污染
        const inds = Array.from(c0.getElementsByTagNameNS(W_NS, 'ind'));
        inds.forEach(ind => {
          if (ind.getAttribute('w:left') === '420') {
            ind.removeAttribute('w:leftChars');
            ind.removeAttributeNS(W_NS, 'leftChars');
            ind.setAttributeNS(W_NS, 'w:leftChars', '0');
          }
        });
      }
    }
  }`;

if (!code.includes(oldSec45)) {
  console.error('oldSec45 not found in pipeline-engine.js');
  process.exit(1);
}
code = code.replace(oldSec45, newSec45);

fs.writeFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/scripts/pipeline_engine_proposed.js', code, 'utf8');
console.log('pipeline_engine_proposed.js generated successfully!');
