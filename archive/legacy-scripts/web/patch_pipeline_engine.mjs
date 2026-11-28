import fs from 'fs';

let content = fs.readFileSync('./web/src/pipeline-engine.js', 'utf8');
const isCrlf = content.includes('\r\n');
if (isCrlf) content = content.replace(/\r\n/g, '\n');

// 1. Ensure removeCellFromRow is imported from docx-engine.js
if (!content.includes('removeCellFromRow')) {
  content = content.replace(
    /import \{\s*W_NS,/,
    'import {\n  W_NS,\n  removeCellFromRow,'
  );
}

// 2. Section 11 repRow physical cell removal
const targetRepPrune = `if (repRow && repRow.cells.length > 2) {
          for (let cIdx = 1; cIdx < repRow.cells.length - 1; cIdx++) {
            if (/Fertility/i.test(repRow.cells[cIdx].text)) {
              repRow.cells[cIdx].text = '';
            }
          }
        }`;

const newRepPrune = `if (repRow && repRow.cells.length > 2) {
          while (repRow.cells.length > 2) {
            removeCellFromRow(repRow, 1);
          }
        }`;

if (!content.includes(targetRepPrune)) {
  console.log('targetRepPrune not found!');
  process.exit(1);
}
content = content.replace(targetRepPrune, newRepPrune);

// 3. Section 12 English explanation line protection
const targetS12En = `if (s12.rows.length > 5) {
      s12 = deleteRow(engine, s12, 1);
      s12 = deleteRow(engine, s12, 1);
    }`;

const newS12En = `if (s12.rows.length > 5) {
      // 检查 Row 2 是否为旧组分参考数据引导行，仅删除旧组分参考行，保护 Row 1 英文产品级说明行
      const r2Text = (s12.rows[2]?.cells?.map(c => c.text || '').join('') || '');
      if (/The following|reference|Diethylene|CAS/i.test(r2Text) || s12.rows[2]?.cells?.length === 1) {
        s12 = deleteRow(engine, s12, 2);
      } else {
        s12 = deleteRow(engine, s12, 1);
      }
    }`;

if (!content.includes(targetS12En)) {
  console.log('targetS12En not found!');
  process.exit(1);
}
content = content.replace(targetS12En, newS12En);

if (isCrlf) content = content.replace(/\n/g, '\r\n');

fs.writeFileSync('./scratch/pipeline-engine.proposed.js', content, 'utf8');
console.log('Successfully created ./scratch/pipeline-engine.proposed.js');
