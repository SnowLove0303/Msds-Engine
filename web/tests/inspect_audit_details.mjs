import fs from 'fs';
const audit = fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/scripts/audit_bipolar_bilayer.mjs', 'utf8');
const lines = audit.split('\n');

function findInAudit(keyword) {
  console.log(`=== Searching for: ${keyword} ===`);
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(keyword)) {
      console.log(`Line ${i+1}: ${lines[i]}`);
      for (let j = Math.max(0, i-5); j <= Math.min(lines.length-1, i+15); j++) {
        console.log(`  ${j+1}: ${lines[j]}`);
      }
      break;
    }
  }
}

findInAudit('英文版零中文强门禁');
findInAudit('Section 11 英文版 Row 2');
findInAudit('其他危险通栏完备');
findInAudit('left="960"');
findInAudit('其他危险" 法定标签加粗');
