import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';

// Ensure DOMParser and XMLSerializer in global scope for docx-engine
if (!globalThis.DOMParser || !globalThis.XMLSerializer) {
  const dom = new JSDOM('<!doctype html><html><body></body></html>');
  globalThis.DOMParser = dom.window.DOMParser;
  globalThis.XMLSerializer = dom.window.XMLSerializer;
}

import { loadDocx } from '../src/docx-engine.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 机械审计逐行双重对照显示呈现引擎 (Mechanical Line-by-Line Dual-Display Audit Engine)
 * 核心功能：
 * 1. 遍历 Section 2 至 16 的全部行，逐行提取中英文文本对 [CN Source] vs [EN Deliverable]
 * 2. 启发式检测：条件丢失告警 (CONDITION_MISSING_ALARM)、中文字符残留 (CHINESE_RESIDUE_ALARM)、数值漂移预警 (NUMERIC_DRIFT_WARNING)
 * 3. 结构化双重视图呈现，输出到终端 CLI 与 Markdown/JSON 证据单
 * 4. 真实退出码：存在 ALARM 时返回非零，全绿返回 0
 */

export async function auditTranslationDualDisplay(cnDocxPath, enDocxPath, options = {}) {
  const verbose = options.verbose !== false;
  const silent = options.silent === true;

  if (!fs.existsSync(cnDocxPath)) {
    throw new Error(`[DualDisplayAudit] 中文文件不存在: ${cnDocxPath}`);
  }
  if (!fs.existsSync(enDocxPath)) {
    throw new Error(`[DualDisplayAudit] 英文文件不存在: ${enDocxPath}`);
  }

  const cnBuf = fs.readFileSync(cnDocxPath);
  const enBuf = fs.readFileSync(enDocxPath);

  const cnDoc = await loadDocx(cnBuf, path.basename(cnDocxPath));
  const enDoc = await loadDocx(enBuf, path.basename(enDocxPath));

  const results = [];
  let alarmCount = 0;
  let warnCount = 0;
  let passCount = 0;

  if (!silent) {
    console.log('╔════════════════════════════════════════════════════════════════════════════════╗');
    console.log('║       机械审计逐行双重对照显示终审 (Translation Line-by-Line Dual-Display)     ║');
    console.log(`║ 中文依据: ${path.basename(cnDocxPath)}`);
    console.log(`║ 英文依据: ${path.basename(enDocxPath)}`);
    console.log('╚════════════════════════════════════════════════════════════════════════════════╝\n');
  }

  // 遍历 Section 2 至 16 (Section 1 为标题与元数据，核心翻译在 2-16)
  for (let secNum = 2; secNum <= 16; secNum++) {
    const cnS = cnDoc.records.find(r => r.sectionNumber === secNum);
    const enS = enDoc.records.find(r => r.sectionNumber === secNum);

    if (!cnS || !enS) {
      if (!silent) console.warn(`⚠️ [WARN] Section ${secNum} 缺少中或英文对应表格记录`);
      warnCount++;
      continue;
    }

    const secTitleCn = cnS.rows[0]?.cells?.map(c => c.text).join(' ').trim() || `Section ${secNum}`;
    const secTitleEn = enS.rows[0]?.cells?.map(c => c.text).join(' ').trim() || `Section ${secNum}`;

    if (!silent) {
      console.log(`\n──────────────────────────────────────────────────────────────────────────────`);
      console.log(`🔷 [SECTION ${String(secNum).padStart(2, '0')}] ${secTitleCn}  ⟷  ${secTitleEn}`);
      console.log(`──────────────────────────────────────────────────────────────────────────────`);
    }

    const maxRows = Math.max(cnS.rows.length, enS.rows.length);

    for (let r = 0; r < maxRows; r++) {
      const cnRow = cnS.rows[r];
      const enRow = enS.rows[r];

      const cnText = cnRow ? cnRow.cells.map(c => (c.text || '').trim()).join(' | ') : '<MISSING_ROW_IN_CN>';
      const enText = enRow ? enRow.cells.map(c => (c.text || '').trim()).join(' | ') : '<MISSING_ROW_IN_EN>';

      if (!cnRow || !enRow) {
        alarmCount++;
        const itemResult = {
          section: secNum,
          row: r,
          cnText,
          enText,
          status: 'ALARM',
          reason: 'ROW_COUNT_MISMATCH',
          alarms: ['中英文表格行数不匹配']
        };
        results.push(itemResult);
        if (!silent) {
          console.error(`┌─ [Sec ${secNum} Row ${r}] ───────────────────────────────────────────────────────`);
          console.error(`│ [CN Source]     : ${cnText}`);
          console.error(`│ [EN Deliverable]: ${enText}`);
          console.error(`│ [Status]        : ❌ ALARM: 中英文表格行数不匹配`);
          console.error(`└─────────────────────────────────────────────────────────────────────────`);
        }
        continue;
      }

      // 启发式合规核查
      const alarms = [];
      const warnings = [];

      // 1. 中文字符残留核查 (英文版绝不能含中文字符)
      const chineseChars = enText.match(/[\u4e00-\u9fa5]/g);
      if (chineseChars && chineseChars.length > 0) {
        alarms.push(`英文版包含中文字符残留: "${chineseChars.slice(0, 5).join('')}"`);
      }

      // 2. 关键稀释与测试条件遗漏核查 (P01 典型防御)
      if (/按.*(?:1:10|\d+:\d+).*稀释|1:10.*稀释/i.test(cnText)) {
        if (!/dilut/i.test(enText) || !/1:10|\d+:\d+/i.test(enText)) {
          alarms.push('源文包含比例稀释测试条件，但英文翻译遗漏了 dilution 条件！');
        }
      } else if (/1%水溶液|1%.*溶液/i.test(cnText)) {
        if (!/aqueous/i.test(enText) && !/solution/i.test(enText)) {
          alarms.push('源文包含水溶液测试条件，但英文翻译遗漏了 aqueous solution 条件！');
        }
      }

      // 3. 关键数字与公差范围保真核查
      const cnNumbers = [...cnText.matchAll(/(?:\d+(?:\.\d+)?(?:±\d+)?%?)|(?:[<>]\s*\d+)/g)].map(m => m[0].replace(/\s+/g, ''));
      for (const num of cnNumbers) {
        const normNum = num.replace(/[<>]/g, '').trim();
        // 过滤常见小序号如 1, 2, 3
        if (normNum.length > 1 && !enText.replace(/\s+/g, '').includes(normNum)) {
          warnings.push(`数值或公差可能未完全对应: "${num}"`);
        }
      }

      // 4. 化学名称规范化核查 (Section 3)
      if (secNum === 3 && /二甲基乙醇胺/.test(cnText)) {
        if (!/Dimethylethanolamine/i.test(enText)) {
          alarms.push('二甲基乙醇胺未采用标准 IUPAC 英文名 N,N-Dimethylethanolamine');
        }
      }

      // 判定条目状态
      let status = 'MATCH';
      if (alarms.length > 0) {
        status = 'ALARM';
        alarmCount++;
      } else if (warnings.length > 0) {
        status = 'WARNING';
        warnCount++;
      } else {
        passCount++;
      }

      const itemResult = {
        section: secNum,
        row: r,
        cnText,
        enText,
        status,
        alarms,
        warnings
      };
      results.push(itemResult);

      if (!silent) {
        const statusIcon = status === 'MATCH' ? '✅ MATCH' : (status === 'ALARM' ? '❌ ALARM' : '⚠️ WARN');
        console.log(`┌─ [Sec ${String(secNum).padStart(2, '0')}.${String(r).padStart(2, '0')}] ───────────────────────────────────────────────────────`);
        console.log(`│ [CN Source]     : ${cnText}`);
        console.log(`│ [EN Deliverable]: ${enText}`);
        if (alarms.length > 0) {
          console.log(`│ [Alarms]        : ❌ ${alarms.join('; ')}`);
        }
        if (warnings.length > 0) {
          console.log(`│ [Warnings]      : ⚠️ ${warnings.join('; ')}`);
        }
        console.log(`│ [Evaluation]    : ${statusIcon}`);
        console.log(`└─────────────────────────────────────────────────────────────────────────`);
      }
    }
  }

  const summary = {
    totalRowsAudited: results.length,
    passed: passCount,
    alarms: alarmCount,
    warnings: warnCount,
    exitCode: alarmCount === 0 ? 0 : 1
  };

  if (!silent) {
    console.log('\n========================================================================');
    console.log('       逐行双重对照显示机械审计汇总 (Dual-Display Audit Summary)        ');
    console.log(` 总核验条目数 : ${summary.totalRowsAudited}`);
    console.log(` 满分对齐项数 : ${summary.passed} (${((summary.passed / summary.totalRowsAudited) * 100).toFixed(1)}%)`);
    console.log(` 致命报警项数 : ${summary.alarms}`);
    console.log(` 轻微预警项数 : ${summary.warnings}`);
    console.log(` 最终判定退出 : ${summary.exitCode === 0 ? '🏆 PASS (Exit code 0)' : '❌ FAIL (Exit code 1)'}`);
    console.log('========================================================================\n');
  }

  // 写入 JSON 报告
  if (options.jsonPath) {
    fs.writeFileSync(options.jsonPath, JSON.stringify({ summary, results }, null, 2), 'utf-8');
  }

  // 写入 Markdown 报告
  if (options.markdownPath) {
    let md = `# 中英文逐项逐行双重对照显示法医级审计报告\n\n`;
    md += `> **中文依据**: \`${path.basename(cnDocxPath)}\`  \n`;
    md += `> **英文依据**: \`${path.basename(enDocxPath)}\`  \n`;
    md += `> **审计时间**: ${new Date().toISOString()}  \n`;
    md += `> **核验总项数**: ${summary.totalRowsAudited} | **通过**: ${summary.passed} | **报警**: ${summary.alarms} | **预警**: ${summary.warnings}\n\n`;
    md += `| 章节 | 行号 | 中文源句 [CN Source] | 英文交付物句 [EN Deliverable] | 判定结论 | 审计详情 |\n`;
    md += `| :---: | :---: | :--- | :--- | :---: | :--- |\n`;
    for (const r of results) {
      const safeCn = r.cnText.replace(/\|/g, '\\|');
      const safeEn = r.enText.replace(/\|/g, '\\|');
      const detail = [...r.alarms, ...r.warnings].join('<br>') || '无缺陷';
      md += `| Sec ${r.section} | ${r.row} | ${safeCn} | ${safeEn} | ${r.status} | ${detail} |\n`;
    }
    fs.writeFileSync(options.markdownPath, md, 'utf-8');
  }

  return summary;
}

// CLI 直接执行支持
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const args = process.argv.slice(2);
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
用法:
  node web/scripts/audit_translation_dual_display.mjs [选项]

选项:
  --target="<dir>"        指定交付物所在目录 (自动寻找 中文冠志.docx 与 英文Guanzhi.docx)
  --cn="<path>"           指定中文 DOCX 路径
  --en="<path>"           指定英文 DOCX 路径
  --json="<path>"         输出结构化 JSON 证据路径
  --md="<path>"           输出 Markdown 对照表路径
  --help, -h              显示帮助信息
`);
    process.exit(0);
  }

  let targetDir = null;
  let cnPath = null;
  let enPath = null;
  let jsonPath = null;
  let mdPath = null;

  for (const arg of args) {
    if (arg.startsWith('--target=')) targetDir = arg.split('=')[1].replace(/^["']|["']$/g, '');
    else if (arg.startsWith('--cn=')) cnPath = arg.split('=')[1].replace(/^["']|["']$/g, '');
    else if (arg.startsWith('--en=')) enPath = arg.split('=')[1].replace(/^["']|["']$/g, '');
    else if (arg.startsWith('--json=')) jsonPath = arg.split('=')[1].replace(/^["']|["']$/g, '');
    else if (arg.startsWith('--md=')) mdPath = arg.split('=')[1].replace(/^["']|["']$/g, '');
  }

  if (targetDir) {
    const files = fs.readdirSync(targetDir);
    const cnFile = files.find(f => f.includes('msds_CN 冠志.docx') || f.includes('msds_CN.docx'));
    const enFile = files.find(f => f.includes('msds_EN Guanzhi.docx') || f.includes('msds_EN.docx'));
    if (!cnFile || !enFile) {
      console.error(`❌ [ERROR] 在 ${targetDir} 中未找到配对的中文与英文 DOCX 交付物！`);
      process.exit(1);
    }
    cnPath = path.join(targetDir, cnFile);
    enPath = path.join(targetDir, enFile);
  }

  if (!cnPath || !enPath) {
    console.error('❌ [ERROR] 请指定 --target 或同时指定 --cn 与 --en 参数！(运行 --help 查看用法)');
    process.exit(1);
  }

  try {
    const summary = await auditTranslationDualDisplay(cnPath, enPath, {
      jsonPath,
      markdownPath: mdPath
    });
    process.exit(summary.exitCode);
  } catch (err) {
    console.error(`❌ [FATAL] 审计执行崩溃: ${err.message}\n${err.stack}`);
    process.exit(1);
  }
}
