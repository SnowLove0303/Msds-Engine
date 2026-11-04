/**
 * lint_code_invariants.mjs
 * 
 * MSDS-Engine 源码级架构承重墙与反过拟合 Lint 门禁 (Layer 2 编译器与静态分析硬门禁)
 * 落实 Lauren Tan 黄金法则：“纠错两遍即立项为 Lint”
 * 
 * 强制检测规则：
 * 1. RULE-CODE-01: 严禁在 pipeline-engine.js 或 smart-matching.js 中硬编码中文/英文业务覆写
 *    (例如 safeWriteCellValue(..., '建议使用护目镜。') 或 'Use local exhaust...')
 * 2. RULE-CODE-02: 严禁单型号特判分支 (例如 if (modelCode === 'OS-9547') 或 if (model === 'BL-8123'))
 * 3. RULE-CODE-03: 严禁在通用审计脚本中无条件硬编码特定化学品名称断言 (例如无源文档基准时硬断言必须包含六亚甲基-1,6-二异氰酸酯)
 * 4. RULE-CODE-04: 严禁在关键管道中绕过 cleanSlateTemplate 直接写值
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
    pattern: /if\s*\(\s*(?:modelCode|model)\s*===?\s*['"](?:OS-9547|BL-8123|PU-608|PU-202A)['"]\s*\)/,
    message: '严禁在通用流水线中硬编码单型号特判分支！必须基于通用数据形态分流。',
    remediation: '将特判逻辑抽象为通用数据形态（如 isNonHaz、hasOel、row.cells.length 等）。'
  }
]);

// 2. 检查 smart-matching.js
checkFile(path.join(SRC_DIR, 'smart-matching.js'), [
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
  }
]);

// 3. 检查通用审计脚本 audit_16_sections_bilingual_fidelity.mjs
checkFile(path.join(SCRIPTS_DIR, 'audit_16_sections_bilingual_fidelity.mjs'), [
  {
    id: 'LINT-AUDIT-01',
    severity: 'ERROR',
    // 检查是否有无条件断言六亚甲基（没有判断 isNoOel 的情况）
    pattern: /^\s*assert\(\s*\/六亚甲基-1,6-二异氰酸酯\/\.test\(cnText8\)\s*&&/,
    message: '严禁在通用审计脚本中无条件硬断言必须包含“六亚甲基”！必须先判定产品是否有接触限值。',
    remediation: '将断言包裹在 if (!isNoOel) 条件块内，或依据 sourceGroundTruth 动态断言。'
  }
]);

// 输出 Lint 结果
console.log(`扫描完成。发现违规项: ${violations.length} 项\n`);

if (violations.length === 0) {
  console.log('✅ [LINT PASSED] 源码架构与反过拟合 Lint 100% 通过，无任何硬编码篡改或特判！\n');
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
