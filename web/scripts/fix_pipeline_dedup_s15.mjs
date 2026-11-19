import fs from 'fs';

const origPath = 'web/src/pipeline-engine.js';
const origContent = fs.readFileSync(origPath, 'utf8');
const normalized = origContent.replace(/\r\n/g, '\n');

// 1. Remove duplicate write in Chinese S15
const target1Old = `    // 依据 REQ-S15-01: 确保 Row 1 恒久为官方法定子标题，严禁被源文档散文覆盖
    if (s15Rec.rows[1]?.cells?.[0]) {
      safeWriteCellValue(s15Rec.rows[1].cells[0], '物质或混合物的相关安全、健康和环保法律法规');
    }
    if (s15Rec.rows[2]?.cells?.[0]) {
      safeWriteCellValue(s15Rec.rows[2].cells[0], '其它的规定：');
    }
    if (s15Rec.rows[3]?.cells?.[0]) {
      safeWriteCellValue(s15Rec.rows[3].cells[0], '符合下列法规要求：');
    }`;

const target1New = `    // 依据 REQ-S15-01: 确保 Row 1 恒久为官方法定子标题，严禁被源文档散文覆盖
    if (s15Rec.rows[1]?.cells?.[0]) {
      safeWriteCellValue(s15Rec.rows[1].cells[0], '物质或混合物的相关安全、健康和环保法律法规');
    }`;

// 2. Remove duplicate write in English S15
const target2Old = `    // 依据 REQ-S15-03: 确保英文版 Row 1~3 恒久保全标准二级题头与西文标点 (杜绝 ': .')
    if (s15.rows[1]?.cells?.[0]) {
      safeWrite(s15.rows[1].cells[0], 'Relevant safety, health and environmental regulations for the substance or mixture');
    }
    if (s15.rows[2]?.cells?.[0]) {
      safeWrite(s15.rows[2].cells[0], 'Other provisions:');
    }
    if (s15.rows[3]?.cells?.[0]) {
      safeWrite(s15.rows[3].cells[0], 'Complies with the following regulations:');
    }`;

const target2New = `    // 依据 REQ-S15-03: 确保英文版 Row 1 恒久保全标准二级题头
    if (s15.rows[1]?.cells?.[0]) {
      safeWrite(s15.rows[1].cells[0], 'Relevant safety, health and environmental regulations for the substance or mixture');
    }`;

if (!normalized.includes(target1Old)) {
  console.error('Target 1 Old not found!');
  process.exit(1);
}
if (!normalized.includes(target2Old)) {
  console.error('Target 2 Old not found!');
  process.exit(1);
}

let newContent = normalized.replace(target1Old, target1New);
newContent = newContent.replace(target2Old, target2New);

const isCRLF = origContent.includes('\r\n');
const finalContent = isCRLF ? newContent.replace(/\n/g, '\r\n') : newContent;

const propPath = 'web/src/pipeline-engine.proposed.js';
fs.writeFileSync(propPath, finalContent, 'utf8');
console.log('Successfully created ' + propPath);
