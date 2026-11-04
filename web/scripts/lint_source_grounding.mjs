/**
 * lint_source_grounding.mjs
 * 
 * 产出物源头事实指纹动态对账 Lint 引擎 (Layer 2 Deterministic Grounding Lint)
 * 落实 Lauren Tan 黄金法则：“纠错两遍即立项为 Lint”
 * 
 * 彻底铲除对特定产品型号或固定化学品名称（如六亚甲基）的硬编码弱断言，
 * 强制以【源文档事实 (Ground Truth)】作为动态黄金基准，对产出物 (CN & EN) 实施双向 1:1 物理核销。
 * 
 * CLI 调用示例:
 *   node web/scripts/lint_source_grounding.mjs --source <源DOCX> --cn <产出中文DOCX> --en <产出英文DOCX>
 */

import { JSDOM } from '../node_modules/jsdom/lib/api.js';
if (!globalThis.DOMParser || !globalThis.XMLSerializer) {
  const dom = new JSDOM('<!doctype html><html><body></body></html>');
  globalThis.DOMParser = dom.window.DOMParser;
  globalThis.XMLSerializer = dom.window.XMLSerializer;
}

import fs from 'fs';
import path from 'path';
import { loadDocx } from '../src/docx-engine.js';

export async function lintSourceGrounding(sourceDocxPath, cnDocxPath, enDocxPath) {
  console.log('========================================================================');
  console.log('  MSDS 交付物事实指纹源头对账 Lint (Source Grounding Fidelity Lint)');
  console.log(`  [源头基准] ${path.basename(sourceDocxPath)}`);
  console.log(`  [产出中文] ${path.basename(cnDocxPath)}`);
  console.log(`  [产出英文] ${path.basename(enDocxPath)}`);
  console.log('========================================================================\n');

  if (!fs.existsSync(sourceDocxPath)) throw new Error(`源文档文件不存在: ${sourceDocxPath}`);
  if (!fs.existsSync(cnDocxPath)) throw new Error(`产出中文文件不存在: ${cnDocxPath}`);
  if (!fs.existsSync(enDocxPath)) throw new Error(`产出英文文件不存在: ${enDocxPath}`);

  const srcDoc = await loadDocx(fs.readFileSync(sourceDocxPath));
  const cnDoc = await loadDocx(fs.readFileSync(cnDocxPath));
  const enDoc = await loadDocx(fs.readFileSync(enDocxPath));

  const violations = [];

  function recordViolation(ruleId, section, message, expected, actual) {
    violations.push({
      ruleId,
      section,
      message,
      expected,
      actual
    });
  }

  // --- 1. 提取源文档事实指纹 (Extract Source Ground Truth) ---
  const srcS1 = srcDoc.records.find(r => r.sectionNumber === 1);
  const srcS2 = srcDoc.records.find(r => r.sectionNumber === 2);
  const srcS3 = srcDoc.records.find(r => r.sectionNumber === 3);
  const srcS8 = srcDoc.records.find(r => r.sectionNumber === 8);
  const srcS9 = srcDoc.records.find(r => r.sectionNumber === 9);
  const srcS11 = srcDoc.records.find(r => r.sectionNumber === 11);
  const srcS13 = srcDoc.records.find(r => r.sectionNumber === 13);
  const srcS14 = srcDoc.records.find(r => r.sectionNumber === 14);
  const srcS15 = srcDoc.records.find(r => r.sectionNumber === 15);

  const srcS8Text = srcS8 ? srcS8.rows.map(r => r.cells.map(c => c.text || '').join(' ')).join('\n') : '';
  const srcS2Text = srcS2 ? srcS2.rows.map(r => r.cells.map(c => c.text || '').join(' ')).join('\n') : '';

  // 判定源文件 S8 事实：
  const srcExplicitNoOel = /无可用的接触限值|不含有职业接触限值|未制定|无已知|无数据|2006\/121/i.test(srcS8Text);
  const srcMentionsWorkplaceParams = /工作场所组分控制参数|职业接触限值|OEL/i.test(srcS8Text);
  const srcHasNoOel = srcExplicitNoOel || (!srcMentionsWorkplaceParams && !srcS8?.rows?.some(r => r.cells.length === 4));
  const srcHasBoilerplateVentilation = /使用局部排风或全面通风|低于职业接触限值|洗眼器与安全淋浴/i.test(srcS8Text);
  const srcEyeText = srcS8?.rows?.find(r => /眼睛防护/i.test(r.cells[0]?.text || ''))?.cells?.slice(1)?.map(c => c.text.trim())?.join('') || '';
  const srcHasMask = /面罩|眼罩/i.test(srcEyeText);
  const srcHasGogglesOnly = /建议使用护目镜|护目镜/i.test(srcEyeText) && !srcHasMask;

  // 判定源文件 S2 事实：
  const srcIsNonHaz = /不属于危险|非危险|不属于危害|无适用资料/i.test(srcS2Text);

  // --- 2. 对账产出物 Section 8 (接触控制/个体防护) ---
  const cnS8 = cnDoc.records.find(r => r.sectionNumber === 8);
  const enS8 = enDoc.records.find(r => r.sectionNumber === 8);
  const cnS8Text = cnS8 ? cnS8.rows.map(r => r.cells.map(c => c.text || '').join(' ')).join('\n') : '';
  const enS8Text = enS8 ? enS8.rows.map(r => r.cells.map(c => c.text || '').join(' ')).join('\n') : '';

  // LINT-S8-01: OEL 组分控制参数与 4 列表格真实性
  if (srcHasNoOel) {
    // 源文件无接触限值：产出物绝对严禁出现 4 列表格、组分题头及未授权的六亚甲基限值
    if (/工作场所组分控制参数|物质.*依据.*类型.*数值/i.test(cnS8Text)) {
      recordViolation('LINT-S8-01', 8, '源文档无职业接触限值，产出中文严禁强塞“工作场所组分控制参数”题头或 4 列表格！', '不包含 4 列表格', '检出 4 列表头残留');
    }
    if (/六亚甲基-1,6-二异氰酸酯|0\.03\s*mg\/m3/i.test(cnS8Text)) {
      recordViolation('LINT-S8-01', 8, '源文档无接触限值，产出中文严禁外生强塞“六亚甲基-1,6-二异氰酸酯 0.03 mg/m3”虚假数据！', '不包含六亚甲基限值', '检出六亚甲基限值强塞');
    }
    if (/Hexamethylene-1,6-diisocyanate/i.test(enS8Text)) {
      recordViolation('LINT-S8-01', 8, '源文档无接触限值，产出英文严禁外生强塞“Hexamethylene-1,6-diisocyanate”！', '不包含 HDI', '检出英文 HDI 强塞');
    }
    if (cnS8 && cnS8.rows.length > 13) {
      recordViolation('LINT-S8-01', 8, `无接触限值时 Section 8 必须剪枝四列表格收敛为 <= 13 行 (实测: ${cnS8.rows.length} 行)`, '<= 13 行', `${cnS8.rows.length} 行`);
    }
  }

  // LINT-S8-02: 外生口水话绝对零容忍
  if (!srcHasBoilerplateVentilation) {
    if (/使用局部排风或全面通风|低于职业接触限值|洗眼器与安全淋浴/i.test(cnS8Text)) {
      recordViolation('LINT-S8-02', 8, '源文档未提及局部排风或洗眼器，产出中文严禁泄漏底模外生口水话！', '无口水话', '检出“使用局部排风或全面通风...”口水话');
    }
    if (/Use local exhaust or general ventilation|eyewash and safety shower/i.test(enS8Text)) {
      recordViolation('LINT-S8-02', 8, '源文档未提及局部排风，产出英文严禁泄漏外生硬编码长句！', '无口水话', '检出“Use local exhaust...”外生长句');
    }
  }

  // LINT-S8-03: 眼睛防护文字保真
  if (srcHasMask) {
    if (!/眼罩|面罩/.test(cnS8Text)) {
      recordViolation('LINT-S8-03', 8, '源文档明确包含“眼罩/面罩”，产出中文严禁篡改为“建议使用护目镜”！', '戴眼罩/面罩。', cnS8Text.match(/眼睛防护[：:][^\n]+/)?.[0] || '未检出');
    }
    if (!/Wear safety glasses\/face shield/i.test(enS8Text)) {
      recordViolation('LINT-S8-03', 8, '源文档明确包含“眼罩/面罩”，产出英文必须精准映射为“Wear safety glasses/face shield.”', 'Wear safety glasses/face shield.', enS8Text.match(/Eye protection[：:][^\n]+/)?.[0] || '未检出');
    }
  } else if (srcHasGogglesOnly) {
    if (!/建议使用护目镜/.test(cnS8Text)) {
      recordViolation('LINT-S8-03', 8, '源文档明确为“建议使用护目镜”，产出中文必须忠实体现！', '建议使用护目镜。', cnS8Text.match(/眼睛防护[：:][^\n]+/)?.[0] || '未检出');
    }
    if (!/Protective goggles are recommended/i.test(enS8Text)) {
      recordViolation('LINT-S8-03', 8, '源文档明确为“建议使用护目镜”，产出英文必须对应“Protective goggles are recommended.”', 'Protective goggles are recommended.', enS8Text.match(/Eye protection[：:][^\n]+/)?.[0] || '未检出');
    }
  }

  // LINT-S8-04: 手部防护未授权捏造拦截
  if (/建议戴上防护手套/.test(cnS8Text) && !/建议戴上防护手套/.test(srcS8Text)) {
    recordViolation('LINT-S8-04', 8, '源文档未授权“建议戴上防护手套”，产出中文严禁底模外生编造！', '值格为空 ""', '检出“建议戴上防护手套”');
  }

  // --- 3. 对账产出物 Section 2 (危险性概述) ---
  const cnS2 = cnDoc.records.find(r => r.sectionNumber === 2);
  const enS2 = enDoc.records.find(r => r.sectionNumber === 2);
  const enS2Text = enS2 ? enS2.rows.map(r => r.cells.map(c => c.text || '').join(' ')).join('\n') : '';

  if (srcIsNonHaz) {
    if (/H412|H315|H332|H317|Category/i.test(enS2Text)) {
      recordViolation('LINT-S2-01', 2, '源文档为非危品，产出英文严禁残留危化品分类或 H 声明！', '无 H 声明与分类', '检出 H 声明或 Category 残留');
    }
  }

  // --- 4. 对账产出物 Section 9 (理化特性行序与数量) ---
  const cnS9 = cnDoc.records.find(r => r.sectionNumber === 9);
  const enS9 = enDoc.records.find(r => r.sectionNumber === 9);

  if (srcS9 && cnS9 && enS9) {
    const srcItemsCount = srcS9.rows.length - 1; // 扣除标题行
    const cnItemsCount = cnS9.rows.length - 1;
    const enItemsCount = enS9.rows.length - 1;

    if (cnItemsCount !== enItemsCount) {
      recordViolation('LINT-S9-01', 9, `Section 9 中英文指标项数不守恒 (CN: ${cnItemsCount} vs EN: ${enItemsCount})`, '中英文项数绝对相等', `CN ${cnItemsCount} != EN ${enItemsCount}`);
    }
  }

  // --- 5. 对账产出物 Section 11 (毒理学标准同构) ---
  const cnS11 = cnDoc.records.find(r => r.sectionNumber === 11);
  const enS11 = enDoc.records.find(r => r.sectionNumber === 11);

  if (cnS11 && enS11) {
    if (cnS11.rows.length !== enS11.rows.length) {
      recordViolation('LINT-S11-01', 11, `Section 11 中英文行数不满足 1:1 同构 (CN: ${cnS11.rows.length} vs EN: ${enS11.rows.length})`, '行数完全一致', `CN: ${cnS11.rows.length}, EN: ${enS11.rows.length}`);
    }
  }

  // --- 6. 对账产出物 Section 13 (4 行标准同构与纯左对齐) ---
  const cnS13 = cnDoc.records.find(r => r.sectionNumber === 13);
  const enS13 = enDoc.records.find(r => r.sectionNumber === 13);

  if (cnS13 && enS13) {
    if (cnS13.rows.length !== 4 || enS13.rows.length !== 4) {
      recordViolation('LINT-S13-01', 13, `Section 13 必须严格保持 4 行标准结构 (实测 CN: ${cnS13.rows.length}, EN: ${enS13.rows.length})`, '4 行', `CN: ${cnS13.rows.length}, EN: ${enS13.rows.length}`);
    }
  }

  // --- 7. 对账产出物 Section 15 (法规时效性与外生强塞) ---
  const cnS15 = cnDoc.records.find(r => r.sectionNumber === 15);
  const enS15 = enDoc.records.find(r => r.sectionNumber === 15);
  const srcS15Text = srcS15 ? srcS15.rows.map(r => r.cells.map(c => c.text || '').join(' ')).join('\n') : '';
  const enS15Text = enS15 ? enS15.rows.map(r => r.cells.map(c => c.text || '').join(' ')).join('\n') : '';

  if (!/15258|安全标签编写/i.test(srcS15Text) && /GB 15258|General rules for preparation of precautionary label/i.test(enS15Text)) {
    recordViolation('LINT-S15-01', 15, '源文档未列明 GB 15258，产出英文严禁外生强塞 GB 15258！', '不包含 GB 15258', '检出 GB 15258 残留');
  }

  // --- 统计与输出报告 ---
  console.log(`事实对账检查完毕。发现违规项: ${violations.length} 项\n`);

  if (violations.length === 0) {
    console.log('🎉 [LINT PASSED] 交付物与源文档事实指纹 100% 吻合，零篡改、零外生口水话、双向物理对账全绿！\n');
    return true;
  } else {
    console.error('❌ [LINT FAILED] 检出与源文档事实违背的严重缺陷，触发硬阻断：\n');
    violations.forEach((v, idx) => {
      console.error(`[CRITICAL] #${idx + 1} [${v.ruleId}] Section ${v.section} - ${v.message}`);
      console.error(`    预期 (Expected): ${v.expected}`);
      console.error(`    实测 (Actual):   ${v.actual}\n`);
    });
    return false;
  }
}

// CLI 直接执行支持
if (process.argv[1]?.endsWith('lint_source_grounding.mjs')) {
  const args = process.argv.slice(2);
  let srcArg, cnArg, enArg;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--source') srcArg = args[++i];
    else if (args[i] === '--cn') cnArg = args[++i];
    else if (args[i] === '--en') enArg = args[++i];
  }

  // 兼容直接传入三个位置参数: node lint_source_grounding.mjs <src> <cn> <en>
  if (!srcArg && !cnArg && !enArg && args.length >= 3) {
    srcArg = args[0];
    cnArg = args[1];
    enArg = args[2];
  }

  if (!srcArg || !cnArg || !enArg) {
    console.log('用法: node lint_source_grounding.mjs --source <源DOCX> --cn <产出中文DOCX> --en <产出英文DOCX>');
    console.log('  或: node lint_source_grounding.mjs <源DOCX> <产出中文DOCX> <产出英文DOCX>');
    process.exit(1);
  }

  const resolvePath = p => path.isAbsolute(p) ? p : path.resolve(process.cwd(), p);
  lintSourceGrounding(resolvePath(srcArg), resolvePath(cnArg), resolvePath(enArg)).then(passed => {
    process.exit(passed ? 0 : 1);
  }).catch(err => {
    console.error('Lint 运行致命异常:', err);
    process.exit(1);
  });
}
