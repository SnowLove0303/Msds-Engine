import fs from 'fs';

const filePath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/pipeline-engine.js';
const origRaw = fs.readFileSync(filePath, 'utf8');
const isCrlf = origRaw.includes('\r\n');
let content = origRaw.replace(/\r\n/g, '\n');

// 1. Defect 2: English Section 1 main title redundant numbering
const t1 = `    if (/^Identification$/i.test(text)) {
      text = '1. Identification';
    }`;
const r1 = `    if (/^(?:1\\.?)*\\s*Identification$/i.test(text)) {
      text = '1. Identification';
    }`;
if (!content.includes(t1)) throw new Error('Target 1 not found!');
content = content.replace(t1, r1);

// 2. Defect 3: Chinese Section 3 Row 2 table sub-header not merged
const t2 = `      // Section 3 专项：第3行成分通栏合并，表头加粗无冒号
      if (sectionNumber === 3) {
        if (rIdx === 2 && cells.length === 3) {
          const p0 = cells[0].getElementsByTagNameNS(W_NS, 'p')[0];
          const txt0 = (p0?.textContent || '').trim();
          if (/^成分|^3\\.2\\s*Ingredients/i.test(txt0)) {
            try {
              row.removeChild(cells[1]);
              row.removeChild(cells[2]);
              const tcPr = cells[0].getElementsByTagNameNS(W_NS, 'tcPr')[0] || cells[0].ownerDocument.createElementNS(W_NS, 'w:tcPr');
              let span = tcPr.getElementsByTagNameNS(W_NS, 'gridSpan')[0];
              if (!span) {
                span = cells[0].ownerDocument.createElementNS(W_NS, 'w:gridSpan');
                tcPr.appendChild(span);
              }
              span.setAttributeNS(W_NS, 'w:val', '3');
              let tcW = tcPr.getElementsByTagNameNS(W_NS, 'tcW')[0];
              if (!tcW) {
                tcW = cells[0].ownerDocument.createElementNS(W_NS, 'w:tcW');
                tcPr.appendChild(tcW);
              }
              tcW.setAttributeNS(W_NS, 'w:w', '9781');
              tcW.setAttributeNS(W_NS, 'w:type', 'dxa');
            } catch (e) {}
          }
        }`;
const r2 = `      // Section 3 专项：第3行成分通栏合并，表头加粗无冒号
      if (sectionNumber === 3) {
        if (rIdx === 2 && cells.length === 3) {
          const p0 = cells[0].getElementsByTagNameNS(W_NS, 'p')[0];
          const txt0 = (p0?.textContent || '').trim();
          if (/^(?:3\\.2\\s*)?(?:成分|Ingredients)/i.test(txt0)) {
            try {
              row.removeChild(cells[1]);
              row.removeChild(cells[2]);
              let tcPr = cells[0].getElementsByTagNameNS(W_NS, 'tcPr')[0];
              if (!tcPr) {
                tcPr = cells[0].ownerDocument.createElementNS(W_NS, 'w:tcPr');
                cells[0].insertBefore(tcPr, cells[0].firstChild);
              }
              let span = tcPr.getElementsByTagNameNS(W_NS, 'gridSpan')[0];
              if (!span) {
                span = cells[0].ownerDocument.createElementNS(W_NS, 'w:gridSpan');
                tcPr.appendChild(span);
              }
              span.setAttributeNS(W_NS, 'w:val', '3');
              let tcW = tcPr.getElementsByTagNameNS(W_NS, 'tcW')[0];
              if (!tcW) {
                tcW = cells[0].ownerDocument.createElementNS(W_NS, 'w:tcW');
                tcPr.appendChild(tcW);
              }
              tcW.setAttributeNS(W_NS, 'w:w', '9781');
              tcW.setAttributeNS(W_NS, 'w:type', 'dxa');
            } catch (e) {}
          }
        }`;
if (!content.includes(t2)) throw new Error('Target 2 not found!');
content = content.replace(t2, r2);

// 3. Defect 4: English Section 5.4 label missing 'and'
const t3 = `      else if (/Firefighting precautions/i.test(lbl)) safeWrite(c1, enValues['sec5.protective_equipment']);`;
const r3 = `      else if (/Firefighting precautions/i.test(lbl)) {
        writeCellLabel(c0, '5.4\\tFirefighting precautions and protective equipment:', true);
        safeWrite(c1, enValues['sec5.protective_equipment']);
      }`;
if (!content.includes(t3)) throw new Error('Target 3 not found!');
content = content.replace(t3, r3);

// 4. Defect 5: Chinese Section 15 statutory modernity evolution (Decree 591 & GB 30000.2-29)
const t4 = `  // 10.5 规范化 Section 15：源文件仅 4 部法规时，剔除底模外生强塞的 GB 15258
  let s15Rec = engine.records.find(r => r.sectionNumber === 15);
  if (s15Rec) {
    const srcS15 = srcEngine?.records?.find(r => r.sectionNumber === 15);
    const srcS15Text = srcS15 ? srcS15.rows.map(r => r.cells.map(c => c.text).join(' ')).join(' ') : '';
    const srcHasGb15258 = /15258|安全标签编写/i.test(srcS15Text);
    if (!srcHasGb15258) {
      const gb15258Row = s15Rec.rows.find(r => /15258|安全标签/i.test(r.cells[0]?.text || ''));
      if (gb15258Row) {
        s15Rec = deleteRow(engine, s15Rec, s15Rec.rows.indexOf(gb15258Row));
      }
    }
  }`;
const r4 = `  // 10.5 规范化 Section 15：源文件仅 4 部法规时，剔除底模外生强塞的 GB 15258
  let s15Rec = engine.records.find(r => r.sectionNumber === 15);
  if (s15Rec) {
    const srcS15 = srcEngine?.records?.find(r => r.sectionNumber === 15);
    const srcS15Text = srcS15 ? srcS15.rows.map(r => r.cells.map(c => c.text).join(' ')).join(' ') : '';
    const srcHasGb15258 = /15258|安全标签编写/i.test(srcS15Text);
    if (!srcHasGb15258) {
      const gb15258Row = s15Rec.rows.find(r => /15258|安全标签/i.test(r.cells[0]?.text || ''));
      if (gb15258Row) {
        s15Rec = deleteRow(engine, s15Rec, s15Rec.rows.indexOf(gb15258Row));
      }
    }

    // 依据法定现代化公理 (INV-S15-01): 将已废止的 344 号令演进为 591 号令，已废止的 GB 20576 演进为 GB 30000.2-29
    for (const r of s15Rec.rows) {
      const c = r.cells[0];
      if (!c) continue;
      const t = (c.text || '').trim();
      if (/344号/i.test(t)) {
        safeWriteCellValue(c, '危险化学品安全管理条例，国务院令591号');
      } else if (/20576|20598/i.test(t)) {
        safeWriteCellValue(c, 'GB 30000.2-29 化学品分类和标签规范');
      }
    }
  }`;
if (!content.includes(t4)) throw new Error('Target 4 not found!');
content = content.replace(t4, r4);

// 5. Additional Defect 6: Chinese Section 8 Row 11 comma normalization
const t5 = `    const row82 = s8.rows.find(r => /8\\.2\\s*工程控制/i.test(r.cells[0]?.text || ''));
    const s8FullText = s8.rows.map(r => r.cells.map(c => c.text || '').join(' ')).join(' ');
    const isNoOEL = /不含有职业接触限值|不含职业接触|无可用的接触限值|2006\\/121/i.test(s8FullText);
    if (isNoOEL && row82) {
      const r82Idx = s8.rows.indexOf(row82);
      while (s8.rows.length > r82Idx + 1) {
        s8 = deleteRow(engine, s8, s8.rows.length - 1);
      }
    }`;
const r5 = `    const row82 = s8.rows.find(r => /8\\.2\\s*工程控制/i.test(r.cells[0]?.text || ''));
    const s8FullText = s8.rows.map(r => r.cells.map(c => c.text || '').join(' ')).join(' ');
    const isNoOEL = /不含有职业接触限值|不含职业接触|无可用的接触限值|2006\\/121/i.test(s8FullText);
    if (isNoOEL && row82) {
      const r82Idx = s8.rows.indexOf(row82);
      while (s8.rows.length > r82Idx + 1) {
        s8 = deleteRow(engine, s8, s8.rows.length - 1);
      }
      // 标点符号规范化：西文半角逗号替换为中文全角逗号
      if (row82.cells.length > 1 && row82.cells[1]) {
        const val = (row82.cells[1].text || '').trim();
        if (val.includes('2006/121/EG,')) {
          safeWriteCellValue(row82.cells[1], val.replace(/2006\\/121\\/EG,/g, '2006/121/EG，'));
        }
      }
    }`;
if (!content.includes(t5)) throw new Error('Target 5 not found!');
content = content.replace(t5, r5);

const finalOut = isCrlf ? content.replace(/\n/g, '\r\n') : content;
fs.writeFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/scripts/pipeline_engine_proposed.js', finalOut, 'utf8');
console.log('pipeline_engine_proposed.js created successfully.');
