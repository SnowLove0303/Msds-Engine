/**
 * lint_code_invariants.mjs
 * 
 * MSDS-Engine 源码级架构承重墙与反过拟合 Lint 门禁 (Layer 2 编译器与静态分析硬门禁)
 * 落实 Lauren Tan 黄金法则：“纠错两遍即立项为 Lint”
 * 
 * 十大强制架构硬阻断规则：
 * 1. LINT-CODE-01: 严禁在流水线中硬编码眼睛防护覆写（如强制写入“建议使用护目镜”）
 * 2. LINT-CODE-02: 严禁硬编码英文工程控制通风长句
 * 3. LINT-CODE-03: 严禁单型号特判分支（如 PU-1002, OS-9547, BL-8123 等）
 * 4. LINT-CODE-04: 严禁中文手部防护外生编造保底
 * 5. LINT-CODE-05: 严禁英文手部防护外生编造保底
 * 6. LINT-CODE-06: 严禁在毒理学或匹配中硬编码写入“聚氨酯分散体”
 * 7. LINT-CODE-07: 严禁在 cleanSlateTemplate 中对特定化学品进行定向豁免
 * 8. LINT-CODE-08: 严禁在 Section 8 中仅对六亚甲基进行单一硬编码英译
 * 9. LINT-CODE-09: 严禁在 Section 12 中硬编码英文生态说明长句
 * 10. LINT-AUDIT-01: 严禁在通用审计脚本中无条件硬断言特定化学品
 */

import fs from 'fs';
import path from 'path';

const SRC_DIR = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src';
const SCRIPTS_DIR = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/scripts';

const violations = [];

function checkFile(filePath, rules) {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  for (const rule of rules) {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // 忽略注释行
      if (/^\s*\/\//.test(line) || /^\s*\*/.test(line)) continue;

      if (rule.pattern.test(line)) {
        violations.push({
          ruleId: rule.id,
          severity: rule.severity,
          file: path.relative('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine', filePath),
          lineNum: i + 1,
          code: line.trim(),
          message: rule.message,
          remediation: rule.remediation
        });
      }
    }
  }
}

console.log('========================================================================');
console.log('  MSDS-Engine 源码级架构不变量静态分析 Lint (Layer 2 Static Analysis)');
console.log('  十项硬阻断规则检测 (Zero-Tolerance Invariant Checks)');
console.log('========================================================================\n');

// 1. 检查 pipeline-engine.js
checkFile(path.join(SRC_DIR, 'pipeline-engine.js'), [
  {
    id: 'LINT-CODE-01',
    severity: 'ERROR',
    pattern: /safeWriteCellValue\([^,]+,\s*['"]建议使用护目镜。?['"]\)/,
    message: '严禁硬编码眼睛防护文本覆盖！必须保留源文档真实提取事实。',
    remediation: '移除硬编码写入，改用源事实提取值或动态映射。'
  },
  {
    id: 'LINT-CODE-02',
    severity: 'ERROR',
    pattern: /safeWrite\([^,]+,\s*['"]Use local exhaust or general ventilation/,
    message: '严禁硬编码英文工程控制长句！必须根据源事实为空时置空。',
    remediation: '移除硬编码通风长句，严禁底模口水话外生捏造。'
  },
  {
    id: 'LINT-CODE-03',
    severity: 'ERROR',
    pattern: /if\s*\(\s*(?:modelCode|model|targetModel)\s*===?\s*['"](?:OS-9547|BL-8123|PU-608|PU-1002|PU-202A)['"]\s*\)/,
    message: '严禁在通用流水线中硬编码单型号特判分支！必须基于通用数据形态分流。',
    remediation: '将特判逻辑抽象为通用数据形态（如 isNonHaz、hasOel、row.cells.length 等）。'
  },
  {
    id: 'LINT-CODE-08',
    severity: 'ERROR',
    pattern: /if\s*\(c0\s*&&\s*\/六亚甲基-1,6-二异氰酸酯\/i\.test\(c0\.text\)\)\s*safeWrite\(c0,\s*['"]Hexamethylene-1,6-diisocyanate['"]\)/,
    message: '严禁在 Section 8 中仅对六亚甲基单一硬编码写死英译！',
    remediation: '改用通用化学品英译字典 CHEMICAL_TRANSLATION_MAP 迭代匹配。'
  },
  {
    id: 'LINT-CODE-09',
    severity: 'ERROR',
    pattern: /safeWrite\(s12\.rows\[1\]\.cells\[0\],\s*['"]No ecotoxicological studies are available for this product\\.['"]\)/,
    message: '严禁在 Section 12 中硬编码英文生态前言长句！',
    remediation: '改用 translateSection12PreambleToEnglish 动态翻译源前言。'
  },
  {
    id: 'LINT-CODE-11',
    severity: 'ERROR',
    pattern: /\|\|\s*['"](?:1866|UN 1866|RESIN SOLUTION)['"]|unNo\s*\|\|\s*['"]\d+['"]/,
    message: '严禁在通用流水线中硬编码联合国编号（如 1866）、运输名称兜底！必须严格基于源文件真实事实与模板拓扑。',
    remediation: '移除硬编码兜底常量，缺失事实时严格置空或保持源模板拓扑，严禁伪造。'
  }
]);

// 2. 检查 smart-matching.js
checkFile(path.join(SRC_DIR, 'smart-matching.js'), [
  {
    id: 'LINT-CODE-03',
    severity: 'ERROR',
    pattern: /if\s*\(\s*\/PU\[-\s\]\?1002\\b\/i\.test\(targetModel\)\)/,
    message: '严禁针对 PU-1002 等特定型号进行组分特判！',
    remediation: '在组分提取层按源文档原文提取，严禁在匹配层特判。'
  },
  {
    id: 'LINT-CODE-04',
    severity: 'ERROR',
    pattern: /finalHp\s*=\s*['"]建议戴上防护手套。?['"]/,
    message: '严禁手部防护无值时外生编造“建议戴上防护手套。”保底！',
    remediation: '源文档无手部防护建议时保持置空 ""。'
  },
  {
    id: 'LINT-CODE-05',
    severity: 'ERROR',
    pattern: /finalHp\s*=\s*['"]Protective gloves are recommended\.?['"]/,
    message: '严禁英文手部防护外生编造保底！',
    remediation: '源文档无建议时保持置空 ""。'
  },
  {
    id: 'LINT-CODE-06',
    severity: 'ERROR',
    pattern: /['"]聚氨酯分散体\\n无数据资料['"]|['"]致癌性\\n聚氨酯分散体\\n无数据资料['"]/,
    message: '严禁在毒理学中硬编码写入“聚氨酯分散体”！',
    remediation: '动态从 Section 3 提取当前产品真实主组分名称。'
  },
  {
    id: 'LINT-CODE-07',
    severity: 'ERROR',
    pattern: /if\s*\(s\s*===\s*8\s*&&\s*\/六亚甲基-1,6-二异氰酸酯.*\/i\.test\(rowText\)\)\s*continue;/,
    message: '严禁在 cleanSlateTemplateRecord 中针对特定化学品设置清空豁免后门！',
    remediation: '删除定向豁免，底模数据行必须 100% 绝对清零。'
  }
]);

// 3. 检查通用审计脚本 audit_16_sections_bilingual_fidelity.mjs
checkFile(path.join(SCRIPTS_DIR, 'audit_16_sections_bilingual_fidelity.mjs'), [
  {
    id: 'LINT-AUDIT-01',
    severity: 'ERROR',
    pattern: /^\s*assert\(\s*\/六亚甲基-1,6-二异氰酸酯\/\.test\(cnText8\)\s*&&/,
    message: '严禁在通用审计脚本中无条件硬断言必须包含“六亚甲基”！必须先判定产品是否有接触限值。',
    remediation: '将断言包裹在 if (!isNoOel) 条件块内，或依据 sourceGroundTruth 动态断言。'
  }
]);

// 4. LINT-LOCK-01: 校验 web/src/*.js 中所有 @ANTIGRAVITY_INVARIANT_LOCK_START / END 封印标记必须完整成对
if (fs.existsSync(SRC_DIR)) {
  for (const fileName of fs.readdirSync(SRC_DIR)) {
    if (!fileName.endsWith('.js')) continue;
    const fp = path.join(SRC_DIR, fileName);
    const srcText = fs.readFileSync(fp, 'utf-8');
    const starts = (srcText.match(/@ANTIGRAVITY_INVARIANT_LOCK_START/g) || []).length;
    const ends = (srcText.match(/@ANTIGRAVITY_INVARIANT_LOCK_END/g) || []).length;
    if (starts !== ends) {
      violations.push({
        ruleId: 'LINT-LOCK-01',
        severity: 'ERROR',
        file: path.relative('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine', fp),
        lineNum: 1,
        code: `START=${starts}, END=${ends}`,
        message: '源码防篡改封印标记 @ANTIGRAVITY_INVARIANT_LOCK_START 与 END 数量不成对，存在截断或破坏风险！',
        remediation: '核对并恢复成对的 @ANTIGRAVITY_INVARIANT_LOCK_START / END 注释标记。'
      });
    }
  }
}

// 输出 Lint 结果
console.log(`扫描完成。发现违规项: ${violations.length} 项\n`);

if (violations.length === 0) {
  console.log('✅ [LINT PASSED] 源码架构与反过拟合 10 大硬门禁 100% 通过，无任何硬编码篡改或特判！\n');
  process.exit(0);
} else {
  console.error('❌ [LINT FAILED] 检测到源码架构违规，触发硬阻断：\n');
  violations.forEach((v, idx) => {
    console.error(`[${v.severity}] #${idx + 1} [${v.ruleId}] ${v.file}:${v.lineNum}`);
    console.error(`    代码: ${v.code}`);
    console.error(`    规则: ${v.message}`);
    console.error(`    指引: ${v.remediation}\n`);
  });
  process.exit(1);
}
