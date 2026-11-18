import fs from 'fs';

let content = fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/scripts/run_master_msds_audit.mjs', 'utf8');

const targetAnchor = "    // 检查 Table 8 值文本排版格式与符号规范 (INV-TYPOGRAPHY-S8)";

const newAuditBlock = `    // 检查全文档跨章节值格字体与字阶全局一致性零方差门禁 (INV-CROSS-SECTION-TYPOGRAPHY-ZERO-VARIANCE)
    let crossSecBadSzCountCn = 0;
    tablesCn.forEach((tbl, tIdx) => {
      // 检查 Section 1..16 所有表格的值单元格
      const rows = Array.from(tbl.getElementsByTagName('w:tr'));
      for (let rIdx = 1; rIdx < rows.length; rIdx++) {
        const cells = Array.from(rows[rIdx].getElementsByTagName('w:tc'));
        if (cells.length < 2) continue;
        const rowText = cells.map(c => (c.textContent || '').trim()).join(' ');
        if (/化学品名称.*CAS编号|物质.*依据.*类型|Components.*Basis.*Type|Substance.*Basis.*Type/i.test(rowText)) continue;
        for (let cIdx = 1; cIdx < cells.length; cIdx++) {
          const cell = cells[cIdx];
          const txt = (cell.textContent || '').trim();
          if (!txt || /^(?:CAS编号|含量%（w\\/w）|依据|类型|数值)$/i.test(txt)) continue;
          const runs = Array.from(cell.getElementsByTagName('w:r'));
          for (const r of runs) {
            const rTxt = (r.textContent || '').trim();
            if (!rTxt) continue;
            const sz = r.getElementsByTagName('w:sz')[0]?.getAttribute('w:val');
            if (sz && sz !== '24') crossSecBadSzCountCn++;
          }
        }
      }
    });

    assert(
      crossSecBadSzCountCn === 0,
      '环3',
      '全篇跨章节中文值格字阶零方差一致性断言 (INV-FONT-UNIFORMITY)',
      '全篇所有章节（Section 1~16）中文值格字阶必须保持 100% 均一性，统一为小四号 12pt (sz="24")，零方差偏离',
      \`偏离 sz=24 的值格文本 Run 数: \${crossSecBadSzCountCn}\`,
      'Full Document CN Value Cells'
    );

    let crossSecBadSzCountEn = 0;
    tablesEn.forEach((tbl, tIdx) => {
      const rows = Array.from(tbl.getElementsByTagName('w:tr'));
      for (let rIdx = 1; rIdx < rows.length; rIdx++) {
        const cells = Array.from(rows[rIdx].getElementsByTagName('w:tc'));
        if (cells.length < 2) continue;
        const rowText = cells.map(c => (c.textContent || '').trim()).join(' ');
        if (/Components.*Basis.*Type|Substance.*Basis.*Type/i.test(rowText)) continue;
        for (let cIdx = 1; cIdx < cells.length; cIdx++) {
          const cell = cells[cIdx];
          const txt = (cell.textContent || '').trim();
          if (!txt || /^(?:CAS NO\\.|Concentration % \\(w\\/w\\)|Basis|Type|Value)$/i.test(txt)) continue;
          const runs = Array.from(cell.getElementsByTagName('w:r'));
          for (const r of runs) {
            const rTxt = (r.textContent || '').trim();
            if (!rTxt) continue;
            const sz = r.getElementsByTagName('w:sz')[0]?.getAttribute('w:val');
            if (sz && sz !== '19') crossSecBadSzCountEn++;
          }
        }
      }
    });

    assert(
      crossSecBadSzCountEn === 0,
      '环3',
      '全篇跨章节英文值格字阶零方差一致性断言 (INV-FONT-UNIFORMITY)',
      '全篇所有章节（Section 1~16）英文值格字阶必须保持 100% 均一性，统一为五号 9.5pt (sz="19")，零方差偏离',
      \`偏离 sz=19 的值格文本 Run 数: \${crossSecBadSzCountEn}\`,
      'Full Document EN Value Cells'
    );

` + targetAnchor;

content = content.replace(targetAnchor, newAuditBlock);
fs.writeFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/scripts/proposed_audit.mjs', content);
console.log('proposed_audit.mjs generated successfully!');
