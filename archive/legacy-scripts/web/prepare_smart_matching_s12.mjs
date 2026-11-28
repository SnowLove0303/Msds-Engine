import fs from 'node:fs/promises';

async function updateSmartMatching() {
  const file = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/smart-matching.js';
  let lines = (await fs.readFile(file, 'utf8')).replace(/\r\n/g, '\n').split('\n');

  // Find line with "// 严格保留第 1 行单格说明行"
  const startIdx = lines.findIndex(l => l.includes('// 严格保留第 1 行单格说明行'));
  // Find line with "tRecord = editorEngine.records.find((r) => r.kind === 'table' && r.sectionNumber === 12) || tRecord;"
  const endIdx = lines.findIndex((l, idx) => idx > startIdx && l.includes('renumberRecord(tRecord);'));

  console.log(`Matching from line ${startIdx} to ${endIdx}`);
  if (startIdx !== -1 && endIdx !== -1) {
    const replacement = `          // 【架构级优化】自适应提取源文件 Section 12 中的全部前置说明行 (0行、1行或2行)，绝不主观误删
          const sourcePreambles = [];
          const s12SourceRecord = inspectorRecords?.find((r) => r.kind === 'table' && r.sectionNumber === 12);
          if (s12SourceRecord) {
            for (let rIdx = 1; rIdx < s12SourceRecord.rows.length; rIdx++) {
              const r = s12SourceRecord.rows[rIdx];
              const t = r.cells.map((c) => c.text || '').join('').trim();
              if (/生态毒性|持久性|12\\.\\d/i.test(t)) break;
              if (t) sourcePreambles.push(t);
            }
          }

          // 保持模板与源文件说明行 100% 对称
          const explanationRow1 = tRecord.rows[1]?.cells?.length === 1 ? tRecord.rows[1] : null;
          const explanationRow2 = tRecord.rows[2]?.cells?.length === 1 ? tRecord.rows[2] : null;

          if (sourcePreambles.length >= 2) {
            // 源文件有 2 行说明行：Row 1 产品免责，Row 2 组分生态毒理引言
            if (explanationRow1?.cells[0]) {
              try { writeCellValue(explanationRow1.cells[0], sourcePreambles[0], editorEngine.roleStyles?.value); } catch (e) {}
            }
            if (explanationRow2?.cells[0]) {
              try { writeCellValue(explanationRow2.cells[0], sourcePreambles[1], editorEngine.roleStyles?.value); } catch (e) {}
            }
          } else if (sourcePreambles.length === 1) {
            if (explanationRow1?.cells[0]) {
              try { writeCellValue(explanationRow1.cells[0], sourcePreambles[0], editorEngine.roleStyles?.value); } catch (e) {}
            }
            if (explanationRow2) {
              try {
                const updated = deleteRow(editorEngine, tRecord, 2);
                if (updated) tRecord = updated;
              } catch (e) {}
            }
          } else if (sourcePreambles.length === 0) {
            // 源文件无任何说明行，全部剪掉
            if (explanationRow2) {
              try {
                const updated = deleteRow(editorEngine, tRecord, 2);
                if (updated) tRecord = updated;
              } catch (e) {}
            }
            if (explanationRow1) {
              try {
                const updated = deleteRow(editorEngine, tRecord, 1);
                if (updated) tRecord = updated;
              } catch (e) {}
            }
          }
          tRecord = editorEngine.records.find((r) => r.kind === 'table' && r.sectionNumber === 12) || tRecord;

          // 12.1 生态毒性注入
          const ecoItem = matchedSec.matchedRows.find((r) => r.key === 'ecotoxicity' && r.value);
          const ecoRow = tRecord.rows.find((r) => r.cells.some((c) => /生态毒性/i.test(c.text || '')));
          if (ecoRow && ecoItem) {
            const valCell = ecoRow.cells[ecoRow.cells.length - 1];
            if (valCell && valCell.editable) {
              try { writeCellValue(valCell, ecoItem.value, editorEngine.roleStyles?.value); injectedCount++; } catch (e) {}
            }
          }

          // 12.2 持久性和降解性注入
          const persItem = matchedSec.matchedRows.find((r) => r.key === 'persistence' && r.value);
          const persRow = tRecord.rows.find((r) => r.cells.some((c) => /持久性和降解性/i.test(c.text || '')));
          if (persRow && persItem) {
            let pVal = persItem.value;
            if (pVal && !pVal.startsWith('生物降解性：') && /\\d+\\s*[%％]/i.test(pVal)) {
              pVal = \`生物降解性：\${pVal}\`;
            }
            const valCell = persRow.cells[persRow.cells.length - 1];
            if (valCell && valCell.editable) {
              try { writeCellValue(valCell, pVal, editorEngine.roleStyles?.value); injectedCount++; } catch (e) {}
            }
          }

          // 12.3 其他不利的影响注入
          const otherItem = matchedSec.matchedRows.find((r) => r.key === 'other_adverse_effects' && r.value);
          const otherRow = tRecord.rows.find((r) => r.cells.some((c) => /其他不利的影响|其他不良影响|其他不利影响/i.test(c.text || '')));
          if (otherRow) {
            let oVal = otherItem ? otherItem.value.trim() : '无数据资料。';
            if (oVal && !oVal.endsWith('。')) oVal += '。';
            const valCell = otherRow.cells[otherRow.cells.length - 1];
            if (valCell && valCell.editable) {
              try { writeCellValue(valCell, oVal, editorEngine.roleStyles?.value); injectedCount++; } catch (e) {}
            }
          }

          // 保护说明行与三个标准槽位，修剪 12.3 之后未提及的死重行 (如生物蓄积性、土壤迁移性)
          const currentPreambleRows = tRecord.rows.filter((r, idx) => idx > 0 && r.cells.length === 1 && (/无可用的生态|No ecotoxicological|生态学|以下[是为]|参考数据/i.test(r.cells[0]?.text || '')));
          const targetKeepRows = [...currentPreambleRows, ecoRow, persRow, otherRow].filter(Boolean);
          for (let rIdx = tRecord.rows.length - 1; rIdx >= 1; rIdx--) {
            const row = tRecord.rows[rIdx];
            if (!targetKeepRows.includes(row)) {
              try {
                const updated = deleteRow(editorEngine, tRecord, rIdx);
                if (updated) tRecord = updated;
                prunedCount++;
              } catch (e) {}
            }
          }

          tRecord = editorEngine.records.find((r) => r.kind === 'table' && r.sectionNumber === 12) || tRecord;`;

    lines.splice(startIdx, endIdx - startIdx, replacement);
    await fs.writeFile('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/scratch/smart-matching.proposed_s12.js', lines.join('\n'), 'utf8');
    console.log('Successfully prepared scratch/smart-matching.proposed_s12.js');
  } else {
    console.error('Could not find slice boundaries');
  }
}
updateSmartMatching();
