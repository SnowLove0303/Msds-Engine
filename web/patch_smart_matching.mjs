import fs from 'fs';

let content = fs.readFileSync('./web/src/smart-matching.js', 'utf8');
const isCrlf = content.includes('\r\n');
if (isCrlf) content = content.replace(/\r\n/g, '\n');

// 1. Ensure removeCellFromRow is imported from docx-engine.js
if (!content.includes('removeCellFromRow')) {
  content = content.replace(
    /import \{\s*W_NS,/,
    'import {\n  W_NS,\n  removeCellFromRow,\n  formatSection9LabelCell,'
  );
}

// 2. Section 12 explanation row protection in lines around 4058
const targetS12Keep = `// 修剪 12.3 之后未提及的槽位 (如生物蓄积性、土壤迁移性)
          const targetKeepRows = [ecoRow, persRow, otherRow].filter(Boolean);`;

const newS12Keep = `// 修剪 12.3 之后未提及的槽位 (如生物蓄积性、土壤迁移性)
          const explanationRow = tRecord.rows.find((r, idx) => idx > 0 && r.cells.length === 1 && (/无可用的生态|No ecotoxicological|生态学/i.test(r.cells[0]?.text || '')));
          const targetKeepRows = [explanationRow, ecoRow, persRow, otherRow].filter(Boolean);`;

if (!content.includes(targetS12Keep)) {
  console.log('targetS12Keep not found!');
  process.exit(1);
}
content = content.replace(targetS12Keep, newS12Keep);

// 3. Section 11 repRow physical cell removal
const targetRepMidCell = `// 若底模中包含多列（如中间包含“生育力”占位），清空中间单元格以防残留
            if (repRow.cells.length > 2) {
              for (let cIdx = 1; cIdx < repRow.cells.length - 1; cIdx++) {
                const midCell = repRow.cells[cIdx];
                if (midCell) {
                  midCell.text = '';
                  midCell.labelText = '';
                  midCell.valueText = '';
                  const ps = midCell.node?.getElementsByTagNameNS(W_NS, 'p') || [];
                  for (let pIdx = 0; pIdx < ps.length; pIdx++) {
                    const rs = Array.from(ps[pIdx].getElementsByTagNameNS(W_NS, 'r'));
                    rs.forEach((r) => ps[pIdx].removeChild(r));
                  }
                }
              }
            }`;

const newRepMidCell = `// 若底模中包含多列（如中间包含“生育力”占位），物理移除多余中间单元格，恢复规范 2 列结构
            if (repRow.cells.length > 2) {
              while (repRow.cells.length > 2) {
                removeCellFromRow(repRow, 1);
              }
            }`;

if (!content.includes(targetRepMidCell)) {
  console.log('targetRepMidCell not found!');
  process.exit(1);
}
content = content.replace(targetRepMidCell, newRepMidCell);

// 4. Section 11 附加信息聚合多段数据至单一 11.9
const targetS11Block = `tRecord = editorEngine.records.find((r) => r.kind === 'table' && r.sectionNumber === 11) || tRecord;
          renumberRecord(tRecord, '11');`;

const newS11Block = `// 聚合所有附加信息与重复剂量毒性条目至单一 11.9 附加信息
          const addInfoItems = matchedSec.matchedRows.filter(r => /附加信息|repeated_dose|stot_repeated/i.test(r.key) || /重复剂量|附加信息/i.test(r.slotKey || ''));
          if (addInfoItems.length > 0) {
            const addRow = tRecord.rows.find(r => /附加信息|Additional info/i.test(r.cells?.[0]?.text || ''));
            if (addRow && addRow.cells?.length > 1) {
              const valCell = addRow.cells[addRow.cells.length - 1];
              const fullText = addInfoItems.map(item => item.value.trim()).filter(Boolean).join('\\n\\n');
              if (valCell && valCell.editable) {
                try { writeCellValue(valCell, fullText, editorEngine.roleStyles?.value); injectedCount++; } catch (e) {}
              }
            }
          }
          tRecord = editorEngine.records.find((r) => r.kind === 'table' && r.sectionNumber === 11) || tRecord;
          renumberRecord(tRecord, '11');`;

if (!content.includes(targetS11Block)) {
  console.log('targetS11Block not found!');
  process.exit(1);
}
content = content.replace(targetS11Block, newS11Block);

if (isCrlf) content = content.replace(/\n/g, '\r\n');

fs.writeFileSync('./scratch/smart-matching.proposed.js', content, 'utf8');
console.log('Successfully created ./scratch/smart-matching.proposed.js');
