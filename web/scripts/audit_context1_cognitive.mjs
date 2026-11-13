#!/usr/bin/env node

/**
 * ============================================================================
 * MSDS-Studio Context 1 双盲碰撞辅助认知审计器 (Double-Blind Cognitive Auditor)
 * ============================================================================
 * 
 * 核心宗旨：杜绝先入为主的确证偏差与“看着答案判卷”。
 * 1. 物理遮蔽：剥离 Context 1 现有的【属性】列，只提供行号与文本；
 * 2. 独立判卷：依据知识库定义规则独立推断真实语义角色；
 * 3. 碰撞比对：与 Context 1 实际输出逐行比对，分歧立即抛出 [CRITICAL_CONFLICT]；
 * 4. 报告生成：沉淀标准质检报告 Markdown。
 */

import fs from 'fs';
import path from 'path';
import { parseContext1Markdown, runMechanicalAudit } from './audit_context1_mechanical.mjs';

/**
 * 遮蔽 Context 1 的属性列，生成双盲评测输入数据
 */
export function generateBlindInput(sections) {
  const blindData = [];

  for (let s = 1; s <= 16; s++) {
    const sec = sections[s];
    if (!sec || !sec.rows) continue;

    for (const row of sec.rows) {
      blindData.push({
        sectionNumber: s,
        lineNum: row.lineNum,
        rowIndex: row.rowIndex,
        rawLabel: row.label,
        rawValue: row.value,
        actualAttribute: row.attribute // 仅用于最终碰撞，盲审阶段不向判定核心泄露
      });
    }
  }

  return blindData;
}

/**
 * 独立盲审裁决规则引擎 (基于知识库规范的无偏裁定)
 */
export function blindAdjudicateRow(item) {
  const { sectionNumber, rowIndex, rawLabel, rawValue } = item;
  const lbl = (rawLabel || '').trim();
  const val = (rawValue || '').trim();
  const hasColon = /[:：]$/.test(lbl);

  // 1. 章节大标题 (Section Header)
  if (rowIndex === 0) {
    return {
      inferredAttribute: '章节标题',
      rationale: `第 ${sectionNumber} 部分首行，一级章节大标题`
    };
  }

  // 2. 表头行 (Section 3 成分表等)
  if (sectionNumber === 3 && (lbl.includes('CAS') || val.includes('CAS') || lbl.includes('化学品名称'))) {
    if (rowIndex === 3 || lbl.includes('化学品名称')) {
      return {
        inferredAttribute: '表头',
        rationale: '多列网格表头定义行'
      };
    }
    return {
      inferredAttribute: '组分数据',
      rationale: '化学品多组分 CAS 与浓度网格数据行'
    };
  }

  // 3. 带有标准点分二级序号的题头 (1.1, 4.2, 8.1, 9.1 等)
  if (/^\s*\d{1,2}\.\d+/.test(lbl)) {
    return {
      inferredAttribute: '序号标签',
      rationale: `带有小节点分编号 (${lbl.match(/^\d{1,2}\.\d+/)[0]}) 的属性题头`
    };
  }

  // 4. 前置段落引导语 (即便带冒号，无数据值，也是说明行)
  if (/^(?:类似产品的风险评估数据|其它的规定|其它规定|符合下列法规要求|相关安全、健康|免责声明)[：:]?$/i.test(lbl || val)) {
    return {
      inferredAttribute: '说明行',
      rationale: '段落前言引导语或法规总领句，冒号解耦为说明行'
    };
  }

  // 5. 纯法规条目清单 (无键值对)
  if (/^GB[\/T\s\d]|国务院令|化学品分类和标签/i.test(val || lbl)) {
    return {
      inferredAttribute: '数据值',
      rationale: '国家标准或行政法规清单条目'
    };
  }

  // 6. 长句叙述、警告或无标签纯说明 (烟尘警告、急救措施等)
  if (lbl === '—' || !lbl) {
    return {
      inferredAttribute: '说明行',
      rationale: '左列为空或通栏叙述性长句'
    };
  }
  if (val.length > 30 && !hasColon && lbl.length > 20) {
    return {
      inferredAttribute: '说明行',
      rationale: '长句叙述性说明'
    };
  }

  // 7. 父级分类统领题头 (手部防护、建议、供应商信息)
  if (/^(?:手部防护|分类题头|建议|分类标准|防护指南|通用要求)[：:]?$/i.test(lbl)) {
    return {
      inferredAttribute: '父级标签',
      rationale: '起分类聚合作用的统领性题头 (INV-PRUNE-01 白名单)'
    };
  }

  // 8. 具体细分属性叶子标签
  if (lbl.length <= 25 && (hasColon || lbl.length <= 15)) {
    return {
      inferredAttribute: '子标签',
      rationale: '具体细分参数属性字段，短文本带冒号'
    };
  }

  // 兜底为说明行
  return {
    inferredAttribute: '说明行',
    rationale: '未命中明确标签特征，按说明行处理'
  };
}

/**
 * 1:1 双向碰撞比对器 (Collision Matrix Engine)
 */
export function runCollisionAudit(blindData) {
  const matrix = [];
  let confirmedCount = 0;
  let conflictCount = 0;

  for (const item of blindData) {
    const blindRes = blindAdjudicateRow(item);
    const isMatch = item.actualAttribute === blindRes.inferredAttribute;

    if (isMatch) {
      confirmedCount++;
    } else {
      conflictCount++;
    }

    matrix.push({
      section: item.sectionNumber,
      rowIndex: item.rowIndex,
      lineNum: item.lineNum,
      label: item.rawLabel,
      value: item.rawValue,
      actualAttribute: item.actualAttribute,
      blindAttribute: blindRes.inferredAttribute,
      status: isMatch ? 'CONFIRMED' : 'CRITICAL_CONFLICT',
      rationale: blindRes.rationale
    });
  }

  return {
    totalChecked: blindData.length,
    confirmedCount,
    conflictCount,
    matchRate: blindData.length > 0 ? ((confirmedCount / blindData.length) * 100).toFixed(2) : '100.00',
    matrix
  };
}

/**
 * 生成全景质检报告 Markdown
 */
export function generateAuditReportMarkdown(targetPath, mechResult, collResult) {
  const modelMatch = targetPath.match(/(?:PA|EP|PU|OS|BL|EC)[-_]\d+[A-Z]?/i);
  const modelCode = modelMatch ? modelMatch[0].toUpperCase() : 'UNKNOWN-MODEL';

  let md = `# MSDS Context 1 双轨闭环质检报告 (${modelCode})\n\n`;
  md += `> **质检目标文档**：\`${targetPath}\`  \n`;
  md += `> **质检执行时间**：${new Date().toISOString()}  \n`;
  md += `> **质检体系**：OrbitStack 独立反向证伪机械审计 (P1~P4) + 双盲碰撞辅助认知审计  \n`;
  md += `> **综合审计结论**：${mechResult.isClean && collResult.conflictCount === 0 ? '🟢 **ALL PASS (100% 满分通过)**' : '🔴 **FAIL (存在严重分歧或违规)**'}\n\n`;

  md += `## 一、 机械确定性反向证伪审计结果 (Mechanical Audit Summary)\n\n`;
  md += `| 检查探针 / 门禁项 | 探针猎杀范畴 | 审计结果 | 状态说明 |\n`;
  md += `| :--- | :--- | :---: | :--- |\n`;
  md += `| **M-01 16章节完整性** | 1..16 法定章节无缺失、无跳序 | ${mechResult.findings.some(f => f.code.startsWith('M-01')) ? '❌ FAIL' : '✅ PASS'} | 16 章节全量连续检出 |\n`;
  md += `| **M-02 章节标题纯度** | 排除点分小节伪装大标题、清洗 v 前缀 | ${mechResult.findings.some(f => f.code.startsWith('M-02')) ? '❌ FAIL' : '✅ PASS'} | 大标题纯度 100% |\n`;
  md += `| **M-03 属性词汇闭环** | 8大枚举严格受控、通用“标签”归零 | ${mechResult.findings.some(f => f.code.startsWith('M-03')) ? '❌ FAIL' : '✅ PASS'} | 废除通用标签，父子完全解耦 |\n`;
  md += `| **M-04 4列表格几何结构** | 恒为4列、无管道符破损、行号连续 | ${mechResult.findings.some(f => f.code.startsWith('M-04')) ? '❌ FAIL' : '✅ PASS'} | 结构完整性 100% |\n`;
  md += `| **P1 伪标签猎杀探针** | 猎杀含动词/长句/句号/引言的伪标签 | ${mechResult.findings.some(f => f.code.startsWith('P1')) ? '❌ FAIL' : '✅ PASS'} | 零伪标签放行 |\n`;
  md += `| **P2 伪说明行猎杀探针** | 猎杀标准化工属性降级为说明行 | ${mechResult.findings.some(f => f.code.startsWith('P2')) ? '❌ FAIL' : '✅ PASS'} | 零属性误降级 |\n`;
  md += `| **P3 伪数据值猎杀探针** | 猎杀分类统领题头误填入数据值 | ${mechResult.findings.some(f => f.code.startsWith('P3')) ? '❌ FAIL' : '✅ PASS'} | 零题头错填 |\n`;
  md += `| **M-06 Section 2 穿透解构** | 复合单元格多行多层级原子化拆解 | ${mechResult.findings.some(f => f.code.startsWith('M-06')) ? '❌ FAIL' : '✅ PASS'} | 子题头与子标签完全解耦 |\n`;
  md += `| **M-07 Section 8 层级保全** | 手部防护为父级标签、值格留空保护 | ${mechResult.findings.some(f => f.code.startsWith('M-07')) ? '❌ FAIL' : '✅ PASS'} | 严格遵循 INV-PRUNE-01 |\n\n`;

  md += `## 二、 双盲碰撞辅助认知审计核销矩阵 (Double-Blind Collision Matrix)\n\n`;
  md += `- **总审查行数**: 共 ${collResult.totalChecked} 行  \n`;
  md += `- **双盲吻合数**: ${collResult.confirmedCount} 行  \n`;
  md += `- **双盲冲突数**: ${collResult.conflictCount} 行  \n`;
  md += `- **双盲吻合率**: **${collResult.matchRate}%**\n\n`;

  if (collResult.conflictCount > 0) {
    md += `### 🚨 双盲分歧高危报警表 (Critical Conflicts)\n\n`;
    md += `| 章节 | 行号 | 标签文本 | 实际输出属性 | 盲审推断属性 | 盲审判据说明 |\n`;
    md += `| :---: | :---: | :--- | :---: | :---: | :--- |\n`;
    const conflicts = collResult.matrix.filter(m => m.status === 'CRITICAL_CONFLICT');
    for (const c of conflicts) {
      md += `| 第 ${c.section} 部分 | ${c.rowIndex} | ${c.label} | \`${c.actualAttribute}\` | \`${c.blindAttribute}\` | ${c.rationale} |\n`;
    }
    md += '\n';
  }

  md += `### 📋 核心章节双向碰撞明细抽样 (Representative Sample Verification)\n\n`;
  md += `| 章节 | 行号 | 标签/题头 | 数据值/内容 | 实际属性 | 盲审判定 | 核销状态 |\n`;
  md += `| :---: | :---: | :--- | :--- | :---: | :---: | :---: |\n`;

  // 抽样展示关键章节
  const sampleRows = collResult.matrix.filter(m => 
    [1, 2, 5, 8, 11, 15].includes(m.section) && (m.rowIndex <= 6 || m.status === 'CRITICAL_CONFLICT')
  );

  for (const s of sampleRows) {
    const icon = s.status === 'CONFIRMED' ? '🟢 一致' : '🔴 冲突';
    const cleanLbl = s.label.length > 25 ? s.label.slice(0, 22) + '...' : s.label;
    const cleanVal = s.value.length > 30 ? s.value.slice(0, 27) + '...' : s.value;
    md += `| 第 ${s.section} 部分 | ${s.rowIndex} | ${cleanLbl} | ${cleanVal} | \`${s.actualAttribute}\` | \`${s.blindAttribute}\` | ${icon} |\n`;
  }
  md += '\n';

  md += `## 三、 质检签章与裁决\n\n`;
  if (mechResult.isClean && collResult.conflictCount === 0) {
    md += `**裁决结论**：经独立反向证伪探针与双盲碰撞比对，Context 1 识别结果在【标签 / 值 / 说明行】的分类与归纳上 **100% 准确合规**，无伪标签、无先入为主偏见、无“先射箭再画靶”问题，准予流转至 Stage 3 (Context 2 治理与模板写入)。\n`;
  } else {
    md += `**裁决结论**：存在 ${collResult.conflictCount} 处双盲分歧或机械违章项，**立即阻断**流向 Stage 3，要求退回源识别引擎修复！\n`;
  }

  return md;
}

// ----------------------------------------------------
// CLI 主入口
// ----------------------------------------------------
async function main() {
  const args = process.argv.slice(2);
  const targetArg = args.find(a => a.startsWith('--target='));
  const isReport = args.includes('--report');
  const outArg = args.find(a => a.startsWith('--out='));

  if (!targetArg) {
    console.log('使用说明: node audit_context1_cognitive.mjs --target="path/to/context1.md" [--report] [--out="path/to/report.md"]');
    process.exit(0);
  }

  const targetPath = targetArg.split('=')[1].replace(/['"]/g, '');
  if (!fs.existsSync(targetPath)) {
    console.error(`❌ 目标文件不存在: ${targetPath}`);
    process.exit(1);
  }

  console.log('============================================================');
  console.log('🧠 MSDS-Studio Context 1 双盲碰撞辅助认知审计器');
  console.log(`📄 审计目标: ${targetPath}`);
  console.log('============================================================');

  const mdContent = fs.readFileSync(targetPath, 'utf8');
  const sections = parseContext1Markdown(mdContent);

  // 1. 先跑独立机械审计
  const mechResult = runMechanicalAudit(sections);

  // 2. 跑双盲碰撞审计
  const blindData = generateBlindInput(sections);
  const collResult = runCollisionAudit(blindData);

  console.log(`📊 双盲碰撞核销完成：总行数 ${collResult.totalChecked} | 吻合: ${collResult.confirmedCount} | 冲突: ${collResult.conflictCount} (吻合率: ${collResult.matchRate}%)`);

  if (collResult.conflictCount > 0) {
    console.error('\n🚨 发现双盲冲突分歧项 (CRITICAL CONFLICTS):');
    collResult.matrix.filter(m => m.status === 'CRITICAL_CONFLICT').forEach((c, idx) => {
      console.error(`  ${idx + 1}. 第 ${c.section} 部分 (行号 ${c.rowIndex}): [实际: ${c.actualAttribute}] vs [盲审: ${c.blindAttribute}] - 文本: ${c.label} | ${c.value}`);
    });
  } else {
    console.log('\n🟢 双盲碰撞 100% 吻合！无任何先入为主分类分歧！');
  }

  // 3. 生成报告
  if (isReport || outArg) {
    let outPath = outArg ? outArg.split('=')[1].replace(/['"]/g, '') : null;
    if (!outPath) {
      const dir = path.dirname(targetPath);
      const base = path.basename(targetPath, path.extname(targetPath));
      outPath = path.join(dir, `${base}_audit_report.md`);
    }
    const reportMd = generateAuditReportMarkdown(targetPath, mechResult, collResult);
    fs.writeFileSync(outPath, reportMd, 'utf8');
    console.log(`📝 已生成全景质检报告: ${outPath}`);
  }

  const hasErrors = !mechResult.isClean || collResult.conflictCount > 0;
  process.exit(hasErrors ? 1 : 0);
}

if (process.argv[1] && process.argv[1].endsWith('audit_context1_cognitive.mjs')) {
  main().catch(err => {
    console.error('审计执行异常:', err);
    process.exit(1);
  });
}
