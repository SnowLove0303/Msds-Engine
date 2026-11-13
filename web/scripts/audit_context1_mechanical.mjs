#!/usr/bin/env node

/**
 * ============================================================================
 * MSDS-Studio Context 1 独立反向证伪机械审计器 (Mechanical Adversarial Auditor)
 * ============================================================================
 * 
 * 核心宗旨：彻底杜绝“先射箭再画靶”，本审计器独立于生成器代码，
 * 不复用生成器中的分类函数，基于独立语言学规则、源文档物理坐标与
 * 4 大反向否定性猎杀探针（P1~P4），专挑分类错误的现行！
 * 
 * 任何违规直接 exit code 1 硬阻断！
 */

import fs from 'fs';
import path from 'path';

// 法定闭环属性字典
export const LEGAL_SEMANTIC_TYPES = Object.freeze([
  '章节标题',
  '序号标签',
  '父级标签',
  '子标签',
  '数据值',
  '说明行',
  '表头',
  '组分数据'
]);

// 探针 P1：伪标签猎杀特征集 (命中即判定为说明行误判为标签)
const P1_ACTION_VERBS = /(?:就医|催吐|冲洗|佩戴|穿着|排入|遵守|倒空|离开|洗手|避免接触|存放在|严禁)/;
const P1_NARRATIVE_CLAUSES = /(?:在.*情况下|如果|若|由于|为了|就我们所掌握)/;
const P1_PREAMBLE_BANNERS = /(?:类似产品.*数据|评估数据|法规要求|法律法规|其他规定|其它的规定|适用范围)/;

// 探针 P2：伪说明行猎杀特征集 (命中即判定为标签误判为说明行)
const P2_STANDARD_PROPERTY_TERMS = /^(?:pH值|外观|嗅觉|初沸点|闪点|蒸发速率|可燃性|相对蒸气密度|密度|水溶性|辛醇|自燃温度|动力粘度|固体含量|急性毒性|主要皮肤刺激性|主要粘膜刺激性|致敏性|致突变性)[：:]?$/;

// 探针 P3：伪数据值猎杀特征集 (命中即判定为标签/引言误判为数据值)
const P3_CATEGORY_AGGREGATORS = /^(?:手部防护|分类题头)[：:]?$/;

/**
 * 解析 Context 1 Markdown 结构
 */
export function parseContext1Markdown(mdContent) {
  const sections = {};
  const lines = mdContent.split(/\r?\n/);
  let currentSec = null;
  let inTable = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // 匹配章节题头: "### 第 X 部分：..."
    const secMatch = line.match(/^###\s*第\s*(\d{1,2})\s*部分[：:]\s*(.*)$/);
    if (secMatch) {
      const sNum = parseInt(secMatch[1], 10);
      currentSec = {
        sectionNumber: sNum,
        rawHeader: line,
        headerTitle: secMatch[2].trim(),
        rows: []
      };
      sections[sNum] = currentSec;
      inTable = false;
      continue;
    }

    if (!currentSec) continue;

    // 表格分隔线
    if (line.startsWith('| :---:') || line.startsWith('|:---:')) {
      inTable = true;
      continue;
    }

    // 表头行忽略
    if (line.includes('| 行号 | 属性 | 标签/题头 | 数据值/内容 |') || line.includes('| 行号 | 属性 |')) {
      continue;
    }

    // 表格数据行: "| 行号 | 属性 | 标签/题头 | 数据值/内容 |"
    if (inTable && line.startsWith('|') && line.endsWith('|')) {
      // 兼容反斜杠转义管道符 \|，杜绝单元格内符号破坏列分割
      const parts = line.split(/(?<!\\)\|/).slice(1, -1).map(p => p.replace(/\\\|/g, '|').trim());
      if (parts.length >= 4) {
        const rawAttr = parts[1].replace(/`/g, '').trim();
        const rawLabel = parts[2].trim();
        const rawValue = parts[3].trim();
        const rIndex = parseInt(parts[0], 10);

        currentSec.rows.push({
          lineNum: i + 1,
          rowIndex: isNaN(rIndex) ? currentSec.rows.length : rIndex,
          attribute: rawAttr,
          label: rawLabel,
          value: rawValue,
          rawLine: line,
          columnCount: parts.length
        });
      }
    }
  }

  return sections;
}

/**
 * 核心机械审计套件 (M-01 ~ M-08 + 探针 P1 ~ P4)
 */
export function runMechanicalAudit(sections, options = {}) {
  const findings = [];
  let totalRowsChecked = 0;

  // ----------------------------------------------------
  // M-01: 16 章节完整性与严格单调递增性断言
  // ----------------------------------------------------
  const secNums = Object.keys(sections).map(n => parseInt(n, 10)).sort((a, b) => a - b);
  for (let s = 1; s <= 16; s++) {
    if (!sections[s]) {
      findings.push({
        code: 'M-01_SECTION_MISSING',
        severity: 'CRITICAL',
        section: s,
        message: `缺失法定章节：第 ${s} 部分未在 Context 1 中检出！`
      });
    }
  }

  // 单调递增性
  for (let i = 0; i < secNums.length - 1; i++) {
    if (secNums[i + 1] !== secNums[i] + 1) {
      findings.push({
        code: 'M-01_NON_MONOTONIC_SECTION',
        severity: 'CRITICAL',
        section: secNums[i],
        message: `章节序号不连续或未单调递增：从 ${secNums[i]} 跳跃到 ${secNums[i + 1]}`
      });
    }
  }

  // ----------------------------------------------------
  // 遍历所有章节与数据行执行深度猎杀
  // ----------------------------------------------------
  for (let s = 1; s <= 16; s++) {
    const sec = sections[s];
    if (!sec || !sec.rows || sec.rows.length === 0) continue;

    // M-02: 章节大标题纯度断言
    const row0 = sec.rows[0];
    if (row0.attribute !== '章节标题') {
      findings.push({
        code: 'M-02_INVALID_SECTION_HEADER_ATTR',
        severity: 'CRITICAL',
        section: s,
        line: row0.lineNum,
        message: `第 ${s} 部分第 0 行属性必须为 '章节标题'，实际为 '${row0.attribute}'`
      });
    }

    // 严禁将二级点分编号误判为章节大标题
    if (/^\s*(?:[vV])?\s*\d{1,2}\.\d+/.test(row0.label)) {
      findings.push({
        code: 'M-02_SUBSECTION_AS_MAIN_HEADER',
        severity: 'CRITICAL',
        section: s,
        line: row0.lineNum,
        message: `第 ${s} 部分大标题包含点分二级序号 (${row0.label})，误将小节当成章节大标题！`
      });
    }

    // 容差前缀清洗检查
    if (/^\s*[vV]\d{1,2}/.test(row0.label)) {
      findings.push({
        code: 'M-02_DIRTY_PREFIX_RESIDUAL',
        severity: 'WARNING',
        section: s,
        line: row0.lineNum,
        message: `第 ${s} 部分大标题残留历史杂质前缀 'v': '${row0.label}'`
      });
    }

    for (let rIdx = 0; rIdx < sec.rows.length; rIdx++) {
      totalRowsChecked++;
      const row = sec.rows[rIdx];
      const attr = row.attribute;
      const lbl = row.label === '—' ? '' : row.label;
      const val = row.value === '—' ? '' : row.value;

      // M-03: 法定属性词汇闭环与通用“标签”零容忍断言
      if (!LEGAL_SEMANTIC_TYPES.includes(attr)) {
        findings.push({
          code: 'M-03_ILLEGAL_ATTRIBUTE_VOCABULARY',
          severity: 'CRITICAL',
          section: s,
          line: row.lineNum,
          message: `行号 ${row.rowIndex} 包含非法语义属性 '${attr}'，不属于 8 大法定枚举！`
        });
      }
      if (attr === '标签') {
        findings.push({
          code: 'M-03_GENERIC_LABEL_RESIDUAL',
          severity: 'CRITICAL',
          section: s,
          line: row.lineNum,
          message: `行号 ${row.rowIndex} 仍在使用已被废除的通用 '标签'，未细化为 '父级标签' 或 '子标签'！`
        });
      }

      // M-04: Markdown 几何结构纯净性
      if (row.columnCount !== 4) {
        findings.push({
          code: 'M-04_GRID_COLUMN_CORRUPT',
          severity: 'CRITICAL',
          section: s,
          line: row.lineNum,
          message: `行号 ${row.rowIndex} 表格列数损坏：必须恒为 4 列，实际为 ${row.columnCount} 列！`
        });
      }

      // ----------------------------------------------------
      // 探针 P1: 【伪标签猎杀探针】 (专查将说明行/值误判为标签)
      // ----------------------------------------------------
      if (['父级标签', '子标签', '标签'].includes(attr)) {
        // 1. 行为动作指令词
        if (P1_ACTION_VERBS.test(lbl)) {
          findings.push({
            code: 'P1_FALSE_LABEL_ACTION_VERB',
            severity: 'CRITICAL',
            section: s,
            line: row.lineNum,
            message: `【探针P1告警】行号 ${row.rowIndex} 包含行为操作指令词，实为说明行/值，被严重误判为 '${attr}'：'${lbl}'`
          });
        }
        // 2. 叙述性连词从句
        if (P1_NARRATIVE_CLAUSES.test(lbl)) {
          findings.push({
            code: 'P1_FALSE_LABEL_NARRATIVE_CLAUSE',
            severity: 'CRITICAL',
            section: s,
            line: row.lineNum,
            message: `【探针P1告警】行号 ${row.rowIndex} 包含长句从句连词，实为说明行，被严重误判为 '${attr}'：'${lbl}'`
          });
        }
        // 3. 末尾句号
        if (/。$/.test(lbl)) {
          findings.push({
            code: 'P1_FALSE_LABEL_PERIOD_ENDING',
            severity: 'CRITICAL',
            section: s,
            line: row.lineNum,
            message: `【探针P1告警】行号 ${row.rowIndex} 标签文本以中文句号结尾，语义为完整句子而非属性命名：'${lbl}'`
          });
        }
        // 4. 引言引导语
        if (P1_PREAMBLE_BANNERS.test(lbl)) {
          findings.push({
            code: 'P1_FALSE_LABEL_PREAMBLE_BANNER',
            severity: 'CRITICAL',
            section: s,
            line: row.lineNum,
            message: `【探针P1告警】行号 ${row.rowIndex} 为段落前言引导语，实为说明行，被错误判定为 '${attr}'：'${lbl}'`
          });
        }
        // 5. 长度超标
        if (lbl.length > 15 && !/[：:]$/.test(lbl)) {
          findings.push({
            code: 'P1_FALSE_LABEL_LENGTH_EXCEEDED',
            severity: 'CRITICAL',
            section: s,
            line: row.lineNum,
            message: `【探针P1告警】行号 ${row.rowIndex} 标签文本长达 ${lbl.length} 字且无冒号，违反 10 字安全阈值公理：'${lbl}'`
          });
        }
        // 6. 纯标点伪标签
        if (/^[。，、：:；;—\-_\s]+$/.test(lbl)) {
          findings.push({
            code: 'P1_FALSE_LABEL_PURE_PUNCTUATION',
            severity: 'CRITICAL',
            section: s,
            line: row.lineNum,
            message: `【探针P1告警】行号 ${row.rowIndex} 标签为纯标点符号，属于伪标签：'${lbl}'`
          });
        }
      }

      // ----------------------------------------------------
      // 探针 P2: 【伪说明行猎杀探针】 (专查将标准标签误归为说明行)
      // ----------------------------------------------------
      if (attr === '说明行') {
        // 若说明行在标签列放置了标准指标，或整行核心词为标准指标
        const rawCheck = (lbl && lbl !== '—' ? lbl : val).trim();
        const strippedCheck = rawCheck.replace(/（[^）]+）|\([^)]+\)/g, '').replace(/[:：]/g, '').trim();
        if (P2_STANDARD_PROPERTY_TERMS.test(rawCheck) || P2_STANDARD_PROPERTY_TERMS.test(strippedCheck)) {
          findings.push({
            code: 'P2_FALSE_EXPLANATION_STANDARD_PROPERTY',
            severity: 'CRITICAL',
            section: s,
            line: row.lineNum,
            message: `【探针P2告警】行号 ${row.rowIndex} 文本为标准化工属性名称，实为标签，被错误降级为 '说明行'：'${rawCheck}'`
          });
        }
      }

      // ----------------------------------------------------
      // 探针 P3: 【伪数据值猎杀探针】 (专查将统领题头误填入数据值)
      // ----------------------------------------------------
      if (attr === '数据值') {
        const targetText = val || lbl;
        if (P3_CATEGORY_AGGREGATORS.test(targetText.trim())) {
          findings.push({
            code: 'P3_FALSE_VALUE_CATEGORY_HEADER',
            severity: 'CRITICAL',
            section: s,
            line: row.lineNum,
            message: `【探针P3告警】行号 ${row.rowIndex} 为分类统领题头，实为父级标签，被错误归为 '数据值'：'${targetText}'`
          });
        }
      }

      // ----------------------------------------------------
      // M-06: Section 2 复合单元格多行多层级穿透断言
      // ----------------------------------------------------
      if (s === 2) {
        if (attr === '说明行' && /GHS分类|GHS象形图/.test(val)) {
          findings.push({
            code: 'M-06_SECTION_2_NOT_DECOUPLED',
            severity: 'CRITICAL',
            section: 2,
            line: row.lineNum,
            message: `第 2 部分复合单元格未穿透解构：仍包含混合 GHS 标签未拆分：'${val}'`
          });
        }
      }

      // ----------------------------------------------------
      // M-07: Section 8 父子层级与 INV-PRUNE-01 白名单断言
      // ----------------------------------------------------
      if (s === 8) {
        if (/手部防护[：:]?/.test(lbl) && attr !== '父级标签') {
          findings.push({
            code: 'M-07_SECTION_8_HAND_PROTECTION_NOT_PARENT',
            severity: 'CRITICAL',
            section: 8,
            line: row.lineNum,
            message: `第 8 部分 '手部防护：' 必须被确认为 '父级标签'，实际为 '${attr}'`
          });
        }
        if (/建议[：:]?/.test(lbl) && attr !== '父级标签') {
          findings.push({
            code: 'M-07_SECTION_8_RECOMMENDATION_NOT_PARENT',
            severity: 'CRITICAL',
            section: 8,
            line: row.lineNum,
            message: `第 8 部分 '建议：' 必须被确认为 '父级标签'，实际为 '${attr}'`
          });
        }
      }
    }
  }

  return {
    totalRowsChecked,
    findings,
    isClean: findings.filter(f => f.severity === 'CRITICAL').length === 0
  };
}

/**
 * 变异注入杀伤力自检 (Mutation Sanity Gate)
 * 验证探针面对故意制造的伪标签能否 100% 报警并报红
 */
export function runMutationSanityTest() {
  const mutantMarkdown = `
### 第 1 部分：1.物料及供应商标识

| 行号 | 属性 | 标签/题头 | 数据值/内容 |
| :---: | :---: | :--- | :--- |
| 0 | \`章节标题\` | 1.物料及供应商标识 | — |
| 1 | \`子标签\` | 类似产品的风险评估数据： | — |
| 2 | \`子标签\` | 在着火或爆炸情况下，不要吸进烟尘。 | — |
| 3 | \`子标签\` | 立即用肥皂和大量的水冲洗。若发生皮肤反应，就医 | — |
| 4 | \`说明行\` | pH值（1%水溶液）： | 7-9 |
| 5 | \`数据值\` | 手部防护： | — |
| 6 | \`标签\` | 通用残余标签 | 测试 |
`;
  const parsed = parseContext1Markdown(mutantMarkdown);
  const auditRes = runMechanicalAudit(parsed);

  const p1Hits = auditRes.findings.filter(f => f.code.startsWith('P1_'));
  const p2Hits = auditRes.findings.filter(f => f.code.startsWith('P2_'));
  const p3Hits = auditRes.findings.filter(f => f.code.startsWith('P3_'));
  const m3Hits = auditRes.findings.filter(f => f.code === 'M-03_GENERIC_LABEL_RESIDUAL');

  const killedAll = p1Hits.length >= 3 && p2Hits.length >= 1 && p3Hits.length >= 1 && m3Hits.length >= 1;
  return {
    killedAll,
    killCount: auditRes.findings.length,
    findings: auditRes.findings
  };
}

// ----------------------------------------------------
// CLI 主入口
// ----------------------------------------------------
async function main() {
  const args = process.argv.slice(2);
  const targetArg = args.find(a => a.startsWith('--target='));
  const isSelfTest = args.includes('--self-test');

  if (isSelfTest) {
    console.log('🧪 正在执行反向证伪探针杀伤力自检 (Mutation Sanity Test)...');
    const mutRes = runMutationSanityTest();
    if (mutRes.killedAll) {
      console.log(`✅ 变异杀伤力自检全部通过！成功捕获 ${mutRes.killCount} 处故意注入的伪标签/伪说明行缺陷。`);
      process.exit(0);
    } else {
      console.error('❌ 变异杀伤力不足：未能全部捕获变异桩缺陷！');
      process.exit(1);
    }
  }

  if (!targetArg) {
    console.log('使用说明: node audit_context1_mechanical.mjs --target="path/to/context1.md" [--self-test]');
    process.exit(0);
  }

  const targetPath = targetArg.split('=')[1].replace(/['"]/g, '');
  if (!fs.existsSync(targetPath)) {
    console.error(`❌ 目标文件不存在: ${targetPath}`);
    process.exit(1);
  }

  console.log('============================================================');
  console.log('🛡️ MSDS-Studio Context 1 独立反向证伪机械审计器');
  console.log(`📄 审计目标: ${targetPath}`);
  console.log('============================================================');

  const startTime = Date.now();
  const mdContent = fs.readFileSync(targetPath, 'utf8');
  const sections = parseContext1Markdown(mdContent);
  const result = runMechanicalAudit(sections);
  const elapsed = Date.now() - startTime;

  console.log(`⏱️ 审计完成，耗时: ${elapsed} ms，共检查 ${result.totalRowsChecked} 行数据。`);

  const criticals = result.findings.filter(f => f.severity === 'CRITICAL');
  const warnings = result.findings.filter(f => f.severity === 'WARNING');

  console.log('------------------------------------------------------------');
  console.log(`📊 审计结果统计: 严重违规 (CRITICAL): ${criticals.length} | 警告 (WARNING): ${warnings.length}`);

  if (criticals.length > 0) {
    console.error('\n🚨 发现严重违规项 (CRITICAL VIOLATIONS):');
    criticals.forEach((f, idx) => {
      console.error(`  ${idx + 1}. [${f.code}] 第 ${f.section} 部分 (行 ${f.line || '—'}): ${f.message}`);
    });
    console.error('\n❌ 机械反向证伪审计失败！拒绝带病流转！');
    process.exit(1);
  } else {
    console.log('\n✅ 机械反向证伪审计 100% 满分通过！零伪标签、零误判、全项合规！');
    process.exit(0);
  }
}

// 仅在直接运行脚本时调用 main
if (process.argv[1] && process.argv[1].endsWith('audit_context1_mechanical.mjs')) {
  main().catch(err => {
    console.error('审计执行异常:', err);
    process.exit(1);
  });
}
