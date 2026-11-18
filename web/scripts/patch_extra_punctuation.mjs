import fs from 'fs';

const filePath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/pipeline-engine.js';
const orig = fs.readFileSync(filePath, 'utf8');

// 1. Section 2 cleanCats
const t1 = `    if (!isNonHazardous && parsed) {
      paragraphs.push(
        '2.1 GHS危险性类别：',
        ...parsed.categories,
        '2.2 GHS标签要素：'
      );`;
const r1 = `    if (!isNonHazardous && parsed) {
      const cleanCats = parsed.categories.map(c => c.replace(/,\\s*/g, '，').replace(/\\((H\\d+)\\)/g, '（$1）'));
      paragraphs.push(
        '2.1 GHS危险性类别：',
        ...cleanCats,
        '2.2 GHS标签要素：'
      );`;

// 2. Section 5 full periods
const t2 = `  const s5Rec = engine.records.find(r => r.sectionNumber === 5);
  if (s5Rec) {
    for (const row of s5Rec.rows) {
      const lbl = (row.cells[0]?.text || '').trim();
      if (/合适的灭火剂/i.test(lbl) && row.cells[1]) {
        let val = (row.cells[1].text || '').trim();
        if (val.includes('大火时应用喷洒水') && !val.includes('大火时应用喷洒水。')) {
          val = val.replace(/大火时应用喷洒水(?![。])/g, '大火时应用喷洒水。');
          safeWriteCellValue(row.cells[1], val);
        }
      }
    }
  }`;
const r2 = `  const s5Rec = engine.records.find(r => r.sectionNumber === 5);
  if (s5Rec) {
    for (const row of s5Rec.rows) {
      const lbl = (row.cells[0]?.text || '').trim();
      if (!row.cells[1]) continue;
      let val = (row.cells[1].text || '').trim();
      if (/合适的灭火剂/i.test(lbl)) {
        if (val.includes('大火时应用喷洒水') && !val.includes('大火时应用喷洒水。')) {
          val = val.replace(/大火时应用喷洒水(?![。])/g, '大火时应用喷洒水。');
          safeWriteCellValue(row.cells[1], val);
        }
      } else if (/不合适的灭火剂/i.test(lbl)) {
        if (val && !/[。！]$/.test(val)) {
          safeWriteCellValue(row.cells[1], val + '。');
        }
      } else if (/特殊危害/i.test(lbl)) {
        if (val && !/[。！]$/.test(val)) {
          safeWriteCellValue(row.cells[1], val + '。');
        }
      }
    }
  }`;

// 3. Section 13 period after 滴干
const t3 = `    if (lastRow && lastRow.cells.length >= 2 && lastRow.cells[1]?.node) {
      enforceSection13JustifiedContent(lastRow.cells[1].node);
    }`;
const r3 = `    if (lastRow && lastRow.cells.length >= 2 && lastRow.cells[1]?.node) {
      let mText = (lastRow.cells[1].text || '').trim();
      if (mText.includes('“滴干”）') && !mText.includes('“滴干”）。')) {
        mText = mText.replace(/“滴干”）(?![。])/g, '“滴干”）。');
        safeWriteCellValue(lastRow.cells[1], mText);
      }
      enforceSection13JustifiedContent(lastRow.cells[1].node);
    }`;

// 4. Section 8 glove dash spacing
const t4 = `      // 清理手套参数末尾多余西文句点
      if (row.cells.length > 1 && row.cells[1]?.node) {`;
const r4 = `      // 统一手套材料破折号间距规范
      if (lblCell?.node && /(?:氟化橡胶|丁基橡胶|丁腈橡胶)/i.test(lbl)) {
        const W_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
        const p = lblCell.node.getElementsByTagNameNS(W_NS, 'p')[0];
        if (p) {
          const tNode = p.getElementsByTagNameNS(W_NS, 't')[0];
          if (tNode) {
            tNode.textContent = tNode.textContent
              .replace(/–FKM/g, '– FKM')
              .replace(/–IIR/g, '– IIR')
              .replace(/–\\s*NBR/g, '– NBR');
          }
        }
      }
      // 清理手套参数末尾多余西文句点
      if (row.cells.length > 1 && row.cells[1]?.node) {`;

function replaceBlock(str, target, repl) {
  if (str.includes(target)) return str.replace(target, repl);
  const targetCrlf = target.replace(/\n/g, '\r\n');
  const replCrlf = repl.replace(/\n/g, '\r\n');
  if (str.includes(targetCrlf)) return str.replace(targetCrlf, replCrlf);
  throw new Error(`Target not found: ${target.slice(0, 40)}...`);
}

let updated = orig;
updated = replaceBlock(updated, t1, r1);
updated = replaceBlock(updated, t2, r2);
updated = replaceBlock(updated, t3, r3);
updated = replaceBlock(updated, t4, r4);

fs.writeFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/scripts/pipeline_engine_proposed.js', updated, 'utf8');
console.log('pipeline_engine_proposed.js created successfully.');
