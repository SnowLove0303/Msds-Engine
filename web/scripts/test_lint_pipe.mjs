import fs from 'fs';
import path from 'path';

const SRC_DIR = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src';
const violations = [];

function checkFile(filePath, rules) {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  for (const rule of rules) {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (/^\s*\/\//.test(line) || /^\s*\*/.test(line)) continue;

      if (rule.pattern.test(line)) {
        violations.push({
          ruleId: rule.id,
          file: path.basename(filePath),
          lineNum: i + 1,
          code: line.trim(),
          message: rule.message
        });
      }
    }
  }
}

// 检查 pipeline-engine-proposed.js
checkFile(path.join(SRC_DIR, 'pipeline-engine-proposed.js'), [
  {
    id: 'LINT-CODE-01',
    pattern: /safeWriteCellValue\([^,]+,\s*['"]建议使用护目镜。?['"]\)/,
    message: '严禁硬编码眼睛防护文本覆盖！'
  },
  {
    id: 'LINT-CODE-02',
    pattern: /safeWrite\([^,]+,\s*['"]Use local exhaust or general ventilation/,
    message: '严禁硬编码英文工程控制长句！'
  },
  {
    id: 'LINT-CODE-03',
    pattern: /if\s*\(\s*(?:modelCode|model|targetModel)\s*===?\s*['"](?:OS-9547|BL-8123|PU-608|PU-1002|PU-202A)['"]\s*\)/,
    message: '严禁在通用流水线中硬编码单型号特判分支！'
  },
  {
    id: 'LINT-CODE-08',
    pattern: /if\s*\(c0\s*&&\s*\/六亚甲基-1,6-二异氰酸酯\/i\.test\(c0\.text\)\)\s*safeWrite\(c0,\s*['"]Hexamethylene-1,6-diisocyanate['"]\)/,
    message: '严禁在 Section 8 中仅对六亚甲基单一硬编码写死英译！'
  },
  {
    id: 'LINT-CODE-09',
    pattern: /safeWrite\(s12\.rows\[1\]\.cells\[0\],\s*['"]No ecotoxicological studies are available for this product\\.['"]\)/,
    message: '严禁在 Section 12 中硬编码英文生态前言长句！'
  },
  {
    id: 'LINT-CODE-11',
    pattern: /\|\|\s*['"](?:1866|UN 1866|RESIN SOLUTION)['"]|unNo\s*\|\|\s*['"]\d+['"]/,
    message: '严禁在通用流水线中硬编码联合国编号（如 1866）、运输名称兜底！'
  }
]);

console.log('Violations in pipeline-engine-proposed:', violations.length);
if (violations.length > 0) {
  console.error(violations);
  process.exit(1);
} else {
  console.log('✅ pipeline-engine-proposed.js 100% passed all architecture lint rules!');
}
