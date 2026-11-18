import fs from 'node:fs';

const filePath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/scripts/audit_bipolar_bilayer.mjs';
let content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');
lines.forEach((l, idx) => {
  if (l.includes('Section 11 英文版 Row 2 文本内容正确') || l.includes('s11EnRow2') || l.includes('preamble')) {
    console.log(`${idx + 1}: ${l.trim()}`);
  }
});
