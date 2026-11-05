import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. 加载法定不变量白名单 Oracle
const oraclePath = path.resolve(__dirname, '../src/audit/legal-invariants-oracle.json');
if (!fs.existsSync(oraclePath)) {
  console.error(`[FATAL] Oracle file not found: ${oraclePath}`);
  process.exit(1);
}

const oracle = JSON.parse(fs.readFileSync(oraclePath, 'utf8'));

/**
 * 核心判定函数：检查单条审计 Finding 是否命中法定白名单误报
 * @param {string} text - Finding 标题或详细内容
 * @returns {{ isFalsePositive: boolean, matchedInvariant: any, matchedKeyword: string }}
 */
export function checkFindingForFalsePositive(text) {
  if (!text || typeof text !== 'string') {
    return { isFalsePositive: false };
  }

  for (const inv of oracle.invariants) {
    for (const kw of inv.forbiddenAccusations) {
      if (text.includes(kw)) {
        return {
          isFalsePositive: true,
          matchedInvariant: inv,
          matchedKeyword: kw
        };
      }
    }
  }

  return { isFalsePositive: false };
}

/**
 * 审查整个报告文本或 Finding 列表
 * @param {string} content - 报告全文
 * @returns {Array<{ line: number, text: string, invariant: any, keyword: string }>}
 */
export function auditReportContent(content) {
  const violations = [];
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    const res = checkFindingForFalsePositive(line);
    if (res.isFalsePositive) {
      violations.push({
        line: index + 1,
        text: line.trim(),
        invariant: res.matchedInvariant,
        keyword: res.matchedKeyword
      });
    }
  });

  return violations;
}

// 2. 自检与变异反欺诈测试套件
export function runSelfTest() {
  console.log('=== [LINT:AUDIT] Running Anti-False-Positive Filter Self-Test ===');

  // Test Case 1: Section 1.1 产品名称留空 (必须拦截)
  const falseCase1 = "2. 缺陷 2：Section 1.1 产品名称值格留空，型号被挤入中文名称";
  const res1 = checkFindingForFalsePositive(falseCase1);
  if (!res1.isFalsePositive || res1.matchedInvariant.id !== 'INV-S1-01') {
    console.error('❌ FAILED: Did not intercept Section 1.1 false positive!');
    process.exit(1);
  }
  console.log('✅ PASS: Intercepted Section 1.1 false accusation (INV-S1-01)');

  // Test Case 2: Section 8 颠倒国标层级 (必须拦截)
  const falseCase2 = "4. 缺陷 4：Section 8 标题与层级严重颠倒，颠倒了国标 GB/T 16483 Section 8 先参数后防护的标准层级";
  const res2 = checkFindingForFalsePositive(falseCase2);
  if (!res2.isFalsePositive || res2.matchedInvariant.id !== 'INV-S8-01') {
    console.error('❌ FAILED: Did not intercept Section 8 false positive!');
    process.exit(1);
  }
  console.log('✅ PASS: Intercepted Section 8 false accusation (INV-S8-01)');

  // Test Case 2.1: Section 8 手部防护父级标签免剪枝 (必须拦截)
  const falseCase21 = "缺陷：Section 8 Table 8 Row 4 手部防护未整行删除属于开天窗";
  const res21 = checkFindingForFalsePositive(falseCase21);
  if (!res21.isFalsePositive || res21.matchedInvariant.id !== 'INV-PRUNE-01') {
    console.error('❌ FAILED: Did not intercept Hand Protection parent header false positive!');
    process.exit(1);
  }
  console.log('✅ PASS: Intercepted Hand Protection parent header false accusation (INV-PRUNE-01)');

  // Test Case 2.2: Section 9 源文件无数据保留 (必须拦截)
  const falseCase22 = "缺陷：Section 9 应该删减到12行，保留无数据行属于未剪枝";
  const res22 = checkFindingForFalsePositive(falseCase22);
  if (!res22.isFalsePositive || res22.matchedInvariant.id !== 'INV-S9-01') {
    console.error('❌ FAILED: Did not intercept Section 9 source fidelity false positive!');
    process.exit(1);
  }
  console.log('✅ PASS: Intercepted Section 9 source fidelity false accusation (INV-S9-01)');

  // Test Case 2.3: Section 2 零外生虚增守恒 (必须拦截将"未虚增象形图"误判为遗漏的假阳性)
  const falseCase23 = "缺陷：忠实源文件未虚增象形图属于遗漏";
  const res23 = checkFindingForFalsePositive(falseCase23);
  if (!res23.isFalsePositive || res23.matchedInvariant.id !== 'INV-ZERO-EXOGENOUS') {
    console.error('❌ FAILED: Did not intercept Section 2 zero exogenous fidelity false positive!');
    process.exit(1);
  }
  console.log('✅ PASS: Intercepted Section 2 zero exogenous fidelity false accusation (INV-ZERO-EXOGENOUS)');

  // Test Case 3: 真缺陷 Section 5.4 漏空 (必须放行通过)
  const trueCase1 = "1. 缺陷 1：Section 5.4 保护设备整行漏空，文本错位串行至 5.3";
  const res3 = checkFindingForFalsePositive(trueCase1);
  if (res3.isFalsePositive) {
    console.error('❌ FAILED: Falsely intercepted true defect Section 5.4!');
    process.exit(1);
  }
  console.log('✅ PASS: Correctly allowed true defect Section 5.4');

  // Test Case 4: 真缺陷 Section 10 跳号 (必须放行通过)
  const trueCase2 = "3. 缺陷 3：Section 10 编号跳号，缺失 10.2";
  const res4 = checkFindingForFalsePositive(trueCase2);
  if (res4.isFalsePositive) {
    console.error('❌ FAILED: Falsely intercepted true defect Section 10 skip!');
    process.exit(1);
  }
  console.log('✅ PASS: Correctly allowed true defect Section 10 skip');

  console.log('=== [LINT:AUDIT] All Anti-False-Positive Filter Self-Tests Passed! ===\n');
}

// 3. 命令行调用逻辑
const targetFile = process.argv[2];
if (targetFile) {
  if (targetFile === '--self-test') {
    runSelfTest();
    process.exit(0);
  }

  if (!fs.existsSync(targetFile)) {
    console.error(`[ERROR] Target report file not found: ${targetFile}`);
    process.exit(1);
  }

  const content = fs.readFileSync(targetFile, 'utf8');
  const violations = auditReportContent(content);

  if (violations.length > 0) {
    console.error(`\n🚨 [FATAL ERROR: FALSE POSITIVE DEFECT ACCUSATION DETECTED]`);
    console.error(`检测到待出具报告中包含 ${violations.length} 处将【法定正确规范】误报为【缺陷】的虚假指控！`);
    console.error(`根据《PROJECT_CONSTITUTION》既有业务规范不可否定公理，立即一票否决阻断！\n`);

    violations.forEach(v => {
      console.error(`❌ Line ${v.line}: "${v.text}"`);
      console.error(`   命中禁止指控词: [${v.keyword}]`);
      console.error(`   违反法定不变量: [${v.invariant.id}] ${v.invariant.title}`);
      console.error(`   法定不变量要求: ${v.invariant.rule.split('\n')[0]}`);
    });

    console.error(`\n[REJECTION CODE] AUDIT_FALSE_POSITIVE_DETECTED`);
    console.error(`请根据《PROJECT_CONSTITUTION》纠正审计认知，移除上述错误指控后重新提请发布！\n`);
    process.exit(1);
  } else {
    console.log(`\n✅ [LINT:AUDIT:PASS] 报告经法定不变量 Oracle 严格检阅，未发现任何假阳性误报指控，准予交付发布！\n`);
    process.exit(0);
  }
}
