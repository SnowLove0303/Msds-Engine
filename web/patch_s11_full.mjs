import fs from 'fs';
let content = fs.readFileSync('./src/pipeline-engine.js', 'utf8');
const isCrlf = content.includes('\r\n');
if (isCrlf) content = content.replace(/\r\n/g, '\n');

const targetAnchor = `      renumberRecord(s11, '11');
    }
    // 规范化 Section 11 实测各行行高，消除 11.4 致敏性等行的超高留白`;

const newAnchor = `      renumberRecord(s11, '11');
    }
    // 确保 Section 11 附加信息完整注入
    const addInfoItem = matchResult?.matchedSections?.find(s => s.sectionNumber === 11)?.matchedRows?.find(r => r.key === 'additional_info');
    if (addInfoItem && addInfoItem.value) {
      const addRow = s11.rows.find(r => /附加信息/i.test(r.cells?.[0]?.text || ''));
      if (addRow && addRow.cells?.length > 1) {
        safeWriteCellValue(addRow.cells[addRow.cells.length - 1], addInfoItem.value);
      }
    }
    // 规范化 Section 11 实测各行行高，消除 11.4 致敏性等行的超高留白`;

if (!content.includes(targetAnchor)) {
  console.log('targetAnchor not found!');
  process.exit(1);
}

content = content.replace(targetAnchor, newAnchor);
if (isCrlf) content = content.replace(/\n/g, '\r\n');

fs.writeFileSync('../scratch/pipeline-engine.proposed.js', content, 'utf8');
console.log('Successfully created ../scratch/pipeline-engine.proposed.js');
