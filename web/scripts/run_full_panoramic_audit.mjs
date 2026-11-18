import fs from 'node:fs';
import JSZip from 'jszip';

async function extractXml(path) {
  const zip = await JSZip.loadAsync(fs.readFileSync(path));
  return await zip.file('word/document.xml').async('text');
}

function parseTables(xml) {
  const tblRegex = /<w:tbl[\s\S]*?<\/w:tbl>/g;
  const tables = xml.match(tblRegex) || [];
  return tables.map(tblXml => {
    const rowRegex = /<w:tr[\s\S]*?<\/w:tr>/g;
    const rows = tblXml.match(rowRegex) || [];
    return rows.map(rXml => {
      const cellRegex = /<w:tc[\s\S]*?<\/w:tc>/g;
      const cells = rXml.match(cellRegex) || [];
      return cells.map(cXml => {
        const textRegex = /<w:t[^>]*>([^<]*)<\/w:t>/g;
        let tMatch;
        let cellText = '';
        while ((tMatch = textRegex.exec(cXml)) !== null) {
          cellText += tMatch[1];
        }
        // check alignment
        const jcMatch = cXml.match(/<w:jc w:val="([^"]+)"/);
        const jc = jcMatch ? jcMatch[1] : 'left';
        // check indents
        const indMatch = cXml.match(/<w:ind[^>]*\/>/);
        // check bold
        const boldMatches = cXml.match(/<w:b[ >]/g) || [];
        return {
          text: cellText.trim(),
          rawXml: cXml,
          jc,
          ind: indMatch ? indMatch[0] : null,
          hasBold: boldMatches.length > 0
        };
      });
    });
  });
}

async function runComprehensiveAudit() {
  const targetDir = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/PA-3223';
  const goldenPath = targetDir + '/PA-3223 msds_CN 冠志 手做改版材料.docx';
  const currentPath = targetDir + '/PA-3223 msds_CN 冠志.docx';
  const currentEnPath = targetDir + '/PA-3223 msds_EN Guanzhi.docx';

  const goldenXml = await extractXml(goldenPath);
  const currentXml = await extractXml(currentPath);
  const currentEnXml = await extractXml(currentEnPath);

  const goldenTables = parseTables(goldenXml);
  const currentTables = parseTables(currentXml);

  console.log(`金标准表格数: ${goldenTables.length}, 当前产出表格数: ${currentTables.length}`);

  console.log('\n========================================================================');
  console.log('              PA-3223 逐节 (Section 1 ~ 16) 全面穿透对照审计             ');
  console.log('========================================================================');

  for (let s = 0; s < Math.min(goldenTables.length, currentTables.length); s++) {
    const gRows = goldenTables[s];
    const cRows = currentTables[s];
    console.log(`\n------------------------------------------------------------------------`);
    console.log(`>>> Section ${s + 1} 对照审计 (金标准行数: ${gRows.length}, 产出行数: ${cRows.length})`);
    console.log(`------------------------------------------------------------------------`);

    // 检查行数差异
    if (gRows.length !== cRows.length) {
      console.log(`⚠️ 行数不匹配！金标准: ${gRows.length} 行, 当前产出: ${cRows.length} 行`);
    }

    // 逐行文本比对
    for (let r = 0; r < Math.max(gRows.length, cRows.length); r++) {
      const gRow = gRows[r];
      const cRow = cRows[r];
      if (!gRow) {
        console.log(`  [Row ${r}] 产出多余行: ${cRow.map(c => c.text).join(' | ').slice(0, 80)}`);
        continue;
      }
      if (!cRow) {
        console.log(`  [Row ${r}] 产出缺失行 (金标准有): ${gRow.map(c => c.text).join(' | ').slice(0, 80)}`);
        continue;
      }

      const gText = gRow.map(c => c.text).join(' | ');
      const cText = cRow.map(c => c.text).join(' | ');

      if (gText !== cText) {
        console.log(`  [Row ${r}] 文本差异:`);
        console.log(`    金标准: ${gText.slice(0, 90)}`);
        console.log(`    当前产: ${cText.slice(0, 90)}`);
      } else {
        // 文本一致时检查格式
        const gCells = gRow.length;
        const cCells = cRow.length;
        if (gCells !== cCells) {
          console.log(`  [Row ${r}] 单元格结构差异: 金标准=${gCells}格, 产出=${cCells}格`);
        }
      }
    }
  }

  console.log('\n========================================================================');
  console.log('              英文版 (EN Guanzhi) 对应性与残留审计                       ');
  console.log('========================================================================');
  const enTables = parseTables(currentEnXml);
  console.log(`英文版表格数: ${enTables.length}`);
  const cnChars = currentEnXml.replace(/<[^>]+>/g, '').match(/[\u4e00-\u9fa5]/g) || [];
  console.log(`英文版中文字符数: ${cnChars.length} ${cnChars.length > 0 ? '❌ 发现残留: ' + cnChars.slice(0, 20).join('') : '✅ 0 残留'}`);

  // 检查英文版 S2 和 S11
  if (enTables[1]) {
    console.log('\n英文版 Section 2 内容预览:');
    enTables[1].forEach((r, idx) => {
      console.log(`  Row ${idx}: ${r.map(c => c.text).join(' | ').slice(0, 80)}`);
    });
  }
  if (enTables[10]) {
    console.log('\n英文版 Section 11 内容预览:');
    enTables[10].forEach((r, idx) => {
      console.log(`  Row ${idx}: ${r.map(c => c.text).join(' | ').slice(0, 80)}`);
    });
  }
}

runComprehensiveAudit().catch(console.error);
