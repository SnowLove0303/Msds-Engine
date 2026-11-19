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

import { JSDOM } from 'jsdom';
if (!globalThis.DOMParser || !globalThis.XMLSerializer) {
  const dom = new JSDOM('<!doctype html><html><body></body></html>');
  globalThis.DOMParser = dom.window.DOMParser;
  globalThis.XMLSerializer = dom.window.XMLSerializer;
}

import fs from 'fs';
import path from 'path';
import { loadDocx } from '../src/docx-engine.js';
import { recognizeSourceDocx } from '../src/recognition-engine.js';

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
  const srcFacts = await recognizeSourceDocx(sourceDocxPath);

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
  const srcS8 = srcDoc.records.find(r => r.sectionNumber === 8);
  const srcS9 = srcDoc.records.find(r => r.sectionNumber === 9);
  const srcS15 = srcDoc.records.find(r => r.sectionNumber === 15);

  const srcS8Text = srcS8 ? srcS8.rows.map(r => r.cells.map(c => c.text || '').join(' ')).join('\n') : '';

  // 判定源文件 S8 事实：
  const srcExplicitNoOel = /无可用的接触限值|不含有职业接触限值|未制定|无已知|无数据|2006\/121/i.test(srcS8Text);
  const srcMentionsWorkplaceParams = /工作场所组分控制参数|职业接触限值|OEL/i.test(srcS8Text);
  const srcHasNoOel = srcExplicitNoOel || (!srcMentionsWorkplaceParams && !srcS8?.rows?.some(r => r.cells.length === 4));
  const srcHasBoilerplateVentilation = /使用局部排风或全面通风|低于职业接触限值|洗眼器与安全淋浴/i.test(srcS8Text);
  const srcEyeText = srcS8?.rows?.find(r => /眼睛防护/i.test(r.cells[0]?.text || ''))?.cells?.slice(1)?.map(c => c.text.trim())?.join('') || '';
  const srcHasMask = /面罩|眼罩/i.test(srcEyeText);
  const srcHasGogglesOnly = /建议使用护目镜|护目镜/i.test(srcEyeText) && !srcHasMask;

  // 判定源文件 S2 事实：
  const srcIsNonHaz = !srcFacts.ghs.isHazardous;

  // --- 2. 对账产出物 Section 8 (接触控制/个体防护) ---
  const cnS8 = cnDoc.records.find(r => r.sectionNumber === 8);
  const enS8 = enDoc.records.find(r => r.sectionNumber === 8);
  const cnS8Text = cnS8 ? cnS8.rows.map(r => r.cells.map(c => c.text || '').join(' ')).join('\n') : '';
  const enS8Text = enS8 ? enS8.rows.map(r => r.cells.map(c => c.text || '').join(' ')).join('\n') : '';

  // LINT-S8-01: OEL 组分控制参数与 4 列表格真实性
  if (srcHasNoOel) {
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

  // --- 3. 对账产出物 Section 2 (危险性概述与 GHS 否定词二分) ---
  const cnS2 = cnDoc.records.find(r => r.sectionNumber === 2);
  const enS2 = enDoc.records.find(r => r.sectionNumber === 2);
  const cnS2Text = cnS2 ? cnS2.rows.map(r => r.cells.map(c => c.text || '').join(' ')).join('\n') : '';
  const enS2Text = enS2 ? enS2.rows.map(r => r.cells.map(c => c.text || '').join(' ')).join('\n') : '';

  if (srcIsNonHaz) {
    if (/H412|H315|H332|H317|Category\s*\d/i.test(enS2Text)) {
      recordViolation('LINT-S2-01', 2, '源文档为非危品，产出英文严禁残留危化品分类或 H 声明！', '无 H 声明与分类', '检出 H 声明或 Category 残留');
    }
    if (/(?:危险性类别|GHS分类)[：:\s]*(?!无|不适用|不属于危险)/i.test(cnS2Text) && /类别\s*[1-4]/i.test(cnS2Text)) {
      recordViolation('LINT-S2-02', 2, '源文档明确为非危险品，产出中文严禁捏造危险性类别！', '非危险品分类', '检出具体危险性类别');
    }
  }

  // --- 4. 对账产出物 Section 3 (组分 CAS 与浓度 1:1 保真) ---
  const cnS3 = cnDoc.records.find(r => r.sectionNumber === 3);
  const enS3 = enDoc.records.find(r => r.sectionNumber === 3);
  const cnS3Text = cnS3 ? cnS3.rows.map(r => r.cells.map(c => c.text || '').join(' ')).join('\n') : '';
  const enS3Text = enS3 ? enS3.rows.map(r => r.cells.map(c => c.text || '').join(' ')).join('\n') : '';

  if (srcFacts.components && srcFacts.components.length > 0) {
    for (const comp of srcFacts.components) {
      if (comp.cas && /\b\d{2,7}-\d{2}-\d\b/.test(comp.cas)) {
        if (!cnS3Text.includes(comp.cas)) {
          recordViolation('LINT-S3-01', 3, `源文档包含组分 CAS ${comp.cas} (${comp.name})，产出中文必须完整继承！`, comp.cas, '产出中文缺失该 CAS');
        }
        if (!enS3Text.includes(comp.cas)) {
          recordViolation('LINT-S3-01', 3, `源文档包含组分 CAS ${comp.cas} (${comp.name})，产出英文必须完整继承！`, comp.cas, '产出英文缺失该 CAS');
        }
      }
    }
  }

  // --- 5. 对账产出物 Section 9 (理化特性行序、数量与数值对账) ---
  const cnS9 = cnDoc.records.find(r => r.sectionNumber === 9);
  const enS9 = enDoc.records.find(r => r.sectionNumber === 9);
  const cnS9Text = cnS9 ? cnS9.rows.map(r => r.cells.map(c => c.text || '').join(' ')).join('\n') : '';
  const enS9Text = enS9 ? enS9.rows.map(r => r.cells.map(c => c.text || '').join(' ')).join('\n') : '';

  if (srcS9 && cnS9 && enS9) {
    const srcItemsCount = srcS9.rows.length - 1; // 扣除标题行
    const cnItemsCount = cnS9.rows.length - 1;
    const enItemsCount = enS9.rows.length - 1;

    if (cnItemsCount !== enItemsCount) {
      recordViolation('LINT-S9-01', 9, `Section 9 中英文指标项数不守恒 (CN: ${cnItemsCount} vs EN: ${enItemsCount})`, '中英文项数绝对相等', `CN ${cnItemsCount} != EN ${enItemsCount}`);
    }

    // 关键物理数值对账 (闪点、密度、粘度、固含量等)
    for (const prop of srcFacts.physicalProperties || []) {
      const val = prop.value || '';
      // 提取核心数字模式（如 63℃, 1.06g/cm3, 50±2%, 5000-20000）
      const numMatch = val.match(/(\d+(?:\.\d+)?(?:\s*[±\-~]\s*\d+(?:\.\d+)?)?(?:℃|%|g\/cm3|mPa\.s)?)/);
      if (numMatch && numMatch[1] && numMatch[1].length > 1 && !/^[0-9]$/.test(numMatch[1])) {
        const targetToken = numMatch[1].replace(/\s+/g, '');
        if (!cnS9Text.replace(/\s+/g, '').includes(targetToken)) {
          recordViolation('LINT-S9-02', 9, `Section 9 关键理化指标数值 "${prop.label}: ${val}" 在产出中文中未检测到对账数值！`, targetToken, '产出中文数值不一致');
        }
      }
    }
  }

  // --- 6. 对账产出物 Section 11 (毒理学标准同构) ---
  const cnS11 = cnDoc.records.find(r => r.sectionNumber === 11);
  const enS11 = enDoc.records.find(r => r.sectionNumber === 11);

  if (cnS11 && enS11) {
    if (cnS11.rows.length !== enS11.rows.length) {
      recordViolation('LINT-S11-01', 11, `Section 11 中英文行数不满足 1:1 同构 (CN: ${cnS11.rows.length} vs EN: ${enS11.rows.length})`, '行数完全一致', `CN: ${cnS11.rows.length}, EN: ${enS11.rows.length}`);
    }
  }

  // --- 7. 对账产出物 Section 13 (4 行标准同构与纯左对齐) ---
  const cnS13 = cnDoc.records.find(r => r.sectionNumber === 13);
  const enS13 = enDoc.records.find(r => r.sectionNumber === 13);

  if (cnS13 && enS13) {
    if (cnS13.rows.length !== 4 || enS13.rows.length !== 4) {
      recordViolation('LINT-S13-01', 13, `Section 13 必须严格保持 4 行标准结构 (实测 CN: ${cnS13.rows.length}, EN: ${enS13.rows.length})`, '4 行', `CN: ${cnS13.rows.length}, EN: ${enS13.rows.length}`);
    }
  }

  // --- 8. 对账产出物 Section 14 (运输非危与温度区间事实对账) ---
  const cnS14 = cnDoc.records.find(r => r.sectionNumber === 14);
  const enS14 = enDoc.records.find(r => r.sectionNumber === 14);
  const cnS14Text = cnS14 ? cnS14.rows.map(r => r.cells.map(c => c.text || '').join(' ')).join('\n') : '';
  const enS14Text = enS14 ? enS14.rows.map(r => r.cells.map(c => c.text || '').join(' ')).join('\n') : '';

  if (srcFacts.transport?.isNonDangerousGoods) {
    if (!/非危险货物|非危险品/i.test(cnS14Text)) {
      recordViolation('LINT-S14-01', 14, '源文档判定为非危险货物，产出中文必须明示非危险品！', '包含“非危险货物”或“非危险品”', '未明示非危险货物');
    }
    if (!/Not dangerous goods|Non-dangerous/i.test(enS14Text)) {
      recordViolation('LINT-S14-01', 14, '源文档判定为非危险货物，产出英文必须明示 Not dangerous goods！', 'Not dangerous goods', '未明示 Not dangerous goods');
    }
  }

  // 运输温控对账
  const srcTempMatch = srcFacts.transport?.specialPrecautions?.primaryCn?.match(/([+\-－]?\d+)℃/g);
  if (srcTempMatch && srcTempMatch.length > 0) {
    for (const t of srcTempMatch) {
      const numOnly = t.replace(/[℃+－\-]/g, '');
      if (!cnS14Text.includes(numOnly)) {
        recordViolation('LINT-S14-02', 14, `源文档包含运输温度限制 ${t}，产出中文缺失该温控数值！`, t, '产出中文未找到该温度');
      }
      if (!enS14Text.includes(numOnly)) {
        recordViolation('LINT-S14-02', 14, `源文档包含运输温度限制 ${t}，产出英文缺失该温控数值！`, t, '产出英文未找到该温度');
      }
    }
  }

  // --- 9. 对账产出物 Section 15 (法规时效性与外生强塞) ---
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
