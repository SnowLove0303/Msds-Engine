import fs from 'fs';

const origPath = 'web/src/smart-matching.js';
const origContent = fs.readFileSync(origPath, 'utf8');

const normalized = origContent.replace(/\r\n/g, '\n');

const targetOld = `      // Section 15 法规信息顺序保全与容量自适应克隆
      if (s === 15) {
        // 1. 物质或混合物的相关安全、健康和环保法律法规 写入 Row 1
        const safetyItem = matchedSec.matchedRows.find((r) => r.key === 'safety_regulations' && r.value);
        if (safetyItem && tRecord.rows.length >= 2) {
          const r1 = tRecord.rows[1];
          if (r1 && r1.cells?.[0]) {
            r1.cells[0].editable = true;
            try {
              writeCellValue(r1.cells[0], safetyItem.value, editorEngine.roleStyles?.value);
              injectedCount++;
            } catch (e) {}
          }
        }

        // 2. 5 项法定法规严格按顺序写入`;

const targetNew = `      // Section 15 法规信息顺序保全与容量自适应克隆
      if (s === 15) {
        // 1. 物质或混合物的相关安全、健康和环保法律法规 保持法定子标题 (REQ-S15-01)
        // 铁律防线：Row 1 恒久锁定为官方底模法定二级标题，绝对严禁被源文档散文覆盖
        if (tRecord.rows.length >= 2) {
          const r1 = tRecord.rows[1];
          if (r1 && r1.cells?.[0]) {
            r1.cells[0].editable = true;
            try {
              writeCellValue(r1.cells[0], '物质或混合物的相关安全、健康和环保法律法规', editorEngine.roleStyles?.value);
            } catch (e) {}
          }
        }

        // 2. 5 项法定法规严格按顺序写入`;

if (!normalized.includes(targetOld)) {
  console.error('Target old block still not found in normalized content!');
  // print lines around 4690
  const lines = normalized.split('\n');
  console.log(lines.slice(4690, 4710).join('\n'));
  process.exit(1);
}

const isCRLF = origContent.includes('\r\n');
const newContent = normalized.replace(targetOld, targetNew);
const finalContent = isCRLF ? newContent.replace(/\n/g, '\r\n') : newContent;

const propPath = 'web/src/smart-matching.proposed.js';
fs.writeFileSync(propPath, finalContent, 'utf8');
console.log('Successfully created ' + propPath);
