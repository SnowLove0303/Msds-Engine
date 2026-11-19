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

// Check proposed smart-matching
checkFile(path.join(SRC_DIR, 'smart-matching-proposed.js'), [
  {
    id: 'LINT-CODE-03',
    pattern: /if\s*\(\s*\/PU\[-\s\]\?1002\\b\/i\.test\(targetModel\)\)/,
    message: '严禁针对 PU-1002 等特定型号进行组分特判！'
  },
  {
    id: 'LINT-CODE-04',
    pattern: /finalHp\s*=\s*['"]建议戴上防护手套。?['"]/,
    message: '严禁手部防护无值时外生编造“建议戴上防护手套。”保底！'
  },
  {
    id: 'LINT-CODE-05',
    pattern: /finalHp\s*=\s*['"]Protective gloves are recommended\.?['"]/,
    message: '严禁英文手部防护外生编造保底！'
  },
  {
    id: 'LINT-CODE-06',
    pattern: /['"]聚氨酯分散体\\n无数据资料['"]|['"]致癌性\\n聚氨酯分散体\\n无数据资料['"]/,
    message: '严禁在毒理学中硬编码写入“聚氨酯分散体”！'
  },
  {
    id: 'LINT-CODE-07',
    pattern: /if\s*\(s\s*===\s*8\s*&&\s*\/六亚甲基-1,6-二异氰酸酯.*\/i\.test\(rowText\)\)\s*continue;/,
    message: '严禁在 cleanSlateTemplateRecord 中针对特定化学品设置清空豁免后门！'
  },
  {
    id: 'LINT-CODE-11',
    pattern: /\|\|\s*['"](?:1866|UN 1866|RESIN SOLUTION)['"]|unNo\s*\|\|\s*['"]\d+['"]/,
    message: '严禁在通用流水线中硬编码联合国编号（如 1866）、运输名称兜底！'
  }
]);

// Check proposed context-governor
checkFile(path.join(SRC_DIR, 'context-governor-proposed.js'), [
  {
    id: 'LINT-CODE-03',
    pattern: /if\s*\(\s*(?:modelCode|model|targetModel)\s*===?\s*['"](?:OS-9547|BL-8123|PU-608|PU-1002|PU-202A)['"]\s*\)/,
    message: '严禁单型号特判'
  },
  {
    id: 'LINT-CODE-11',
    pattern: /\|\|\s*['"](?:1866|UN 1866|RESIN SOLUTION)['"]|unNo\s*\|\|\s*['"]\d+['"]/,
    message: '严禁在通用流水线中硬编码联合国编号（如 1866）、运输名称兜底！'
  }
]);

console.log('Violations found:', violations.length);
if (violations.length > 0) {
  console.error(violations);
  process.exit(1);
} else {
  console.log('✅ Proposed files 100% passed all lint rules!');
}
