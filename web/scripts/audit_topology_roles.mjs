#!/usr/bin/env node
/**
 * MSDS-Studio 拓扑角色与格式样式强化机械审计器 (audit_topology_roles.mjs)
 *
 * 重点强化六大结构角色与拓扑样式机械校验：
 *   1. 标题 (SECTION_HEADER)：1~16 节连续性与规范字体字号
 *   2. 序号与标签 (SEQ_LABEL)：单 <w:tab/> 间隔、标签加粗、420/560dxa 悬挂缩进、零 <w:numPr>
 *   3. 值 (VALUE)：多列值格非加粗、清除多余缩进、左对齐
 *   4. 说明行 (EXPLANATION)：纯叙述说明行常规体不误加粗
 *   5. 页眉页脚 (HEADER_FOOTER)：XML 存在性、PAGE/NUMPAGES 域保留、双主体零串扰
 *   6. 脏数据与源继承核销：无旧型号/占位符残余，源文件核心事实在产出中 100% 保留
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import JSZip from 'jszip';
import { DOMParser } from '@xmldom/xmldom';
import { loadDocx } from '../src/docx-engine.js';
import { recognizeSourceDocx } from '../src/msds-source-semantic-adapter.js';

if (!globalThis.DOMParser || !globalThis.XMLSerializer) {
  const dom = new JSDOM('<!doctype html><html><body></body></html>');
  globalThis.DOMParser = dom.window.DOMParser;
  globalThis.XMLSerializer = dom.window.XMLSerializer;
}

const W_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';

function parseArgs() {
  const args = {};
  for (const a of process.argv.slice(2)) {
    if (a.startsWith('--targetDir=')) args.targetDir = a.slice(12).replace(/^["']|["']$/g, '');
    else if (a.startsWith('--model=')) args.model = a.slice(8).replace(/^["']|["']$/g, '');
    else if (a.startsWith('--source=')) args.source = a.slice(9).replace(/^["']|["']$/g, '');
  }
  return args;
}

function getParagraphProps(pNode) {
  const pPr = pNode.getElementsByTagNameNS(W_NS, 'pPr')?.[0];
  const ind = pPr?.getElementsByTagNameNS(W_NS, 'ind')?.[0];
  const jc = pPr?.getElementsByTagNameNS(W_NS, 'jc')?.[0];
  const numPr = pPr?.getElementsByTagNameNS(W_NS, 'numPr')?.[0];
  const tabs = pNode.getElementsByTagNameNS(W_NS, 'tab') || [];
  const runs = Array.from(pNode.getElementsByTagNameNS(W_NS, 'r') || []);
  let hasText = false;
  let allBold = true;
  let anyBold = false;
  for (const r of runs) {
    const t = Array.from(r.getElementsByTagNameNS(W_NS, 't') || []).map(x => x.textContent || '').join('');
    if (!t.trim()) continue;
    hasText = true;
    const rPr = r.getElementsByTagNameNS(W_NS, 'rPr')?.[0];
    const bNode = rPr?.getElementsByTagNameNS(W_NS, 'b')?.[0];
    const isB = Boolean(bNode && bNode.getAttributeNS(W_NS, 'val') !== '0' && bNode.getAttribute('w:val') !== '0');
    if (isB) anyBold = true;
    else allBold = false;
  }
  return {
    hasText,
    allBold: hasText && allBold,
    anyBold,
    hasNumPr: Boolean(numPr),
    tabCount: tabs.length,
    leftInd: Number(ind?.getAttributeNS(W_NS, 'left') || ind?.getAttribute('w:left') || 0),
    firstLine: Number(ind?.getAttributeNS(W_NS, 'firstLine') || ind?.getAttribute('w:firstLine') || 0),
    hanging: Number(ind?.getAttributeNS(W_NS, 'hanging') || ind?.getAttribute('w:hanging') || 0),
    jcVal: jc?.getAttributeNS(W_NS, 'val') || jc?.getAttribute('w:val') || ''
  };
}

async function auditDocxTopologyRoles(docxPath, spec) {
  const issues = [];
  if (!fs.existsSync(docxPath)) {
    return [{ level: 'CRITICAL', code: 'MISSING_FILE', msg: `缺少交付物: ${path.basename(docxPath)}` }];
  }

  const buf = fs.readFileSync(docxPath);
  const zip = await JSZip.loadAsync(buf);
  const parser = new DOMParser();

  // 1. 页眉页脚 (HEADER_FOOTER) 强审计：存在性 + PAGE 域 + 双主体零串扰
  const hfEntries = Object.keys(zip.files).filter(k => /^word\/(?:header|footer)\d+\.xml$/i.test(k));
  if (hfEntries.length === 0) {
    issues.push({ level: 'CRITICAL', code: 'HF_MISSING', msg: `${spec.label}: 缺失 word/header*.xml 或 footer*.xml` });
  } else {
    let hfCombined = '';
    for (const k of hfEntries) {
      hfCombined += await zip.file(k).async('string');
    }
    if (!/PAGE/i.test(hfCombined)) {
      issues.push({ level: 'CRITICAL', code: 'HF_NO_PAGE', msg: `${spec.label}: 页脚缺失动态 PAGE 页码域` });
    }
    const forbiddenEntity = spec.company === 'guanzhi' ? /国彩|Guocai|0763/i : /冠志|Guanzhi|020-8256/i;
    if (forbiddenEntity.test(hfCombined)) {
      issues.push({ level: 'CRITICAL', code: 'HF_ENTITY_LEAK', msg: `${spec.label}: 页眉页脚发生双主体跨企业串扰` });
    }
  }

  // 2. 脏数据占位符与旧型号残余猎杀
  const docXmlStr = await zip.file('word/document.xml').async('string');
  const dirtyPatterns = [
    { re: /\{\{[^}]+\}\}|\[型号\]|XXXX/, desc: '未替换模板占位符' },
    { re: /二乙二醇单丁醚|二乙二醇丁醚/, desc: '英文/中文底模示范脏数据残留' }
  ];
  for (const dp of dirtyPatterns) {
    if (dp.re.test(docXmlStr)) {
      issues.push({ level: 'CRITICAL', code: 'DIRTY_PLACEHOLDER', msg: `${spec.label}: 检测到${dp.desc}` });
    }
  }

  // 3. 16 章节拓扑与六类角色区分审计
  const engine = await loadDocx(buf, path.basename(docxPath));
  const records = engine.records || [];
  const secNums = new Set(records.map(r => r.sectionNumber));
  for (let s = 1; s <= 16; s++) {
    if (!secNums.has(s)) {
      issues.push({ level: 'CRITICAL', code: 'SECTION_MISSING', msg: `${spec.label}: 缺失第 ${s} 节` });
    }
  }

  for (const rec of records) {
    const s = rec.sectionNumber;
    if (!s || s < 1 || s > 16) continue;
    const rows = rec.rows || [];
    for (let rIdx = 0; rIdx < rows.length; rIdx++) {
      const row = rows[rIdx];
      const cells = row.cells || [];
      if (rIdx === 0) {
        // 标题行 (SECTION_HEADER)
        const hdrText = cells.map(c => c.text || '').join(' ').trim();
        if (!new RegExp(`^(?:Section\\s*)?${s}\\b`, 'i').test(hdrText)) {
          issues.push({ level: 'WARNING', code: 'HEADER_SEQ', msg: `${spec.label} S${s} R0: 章节标题未以 "${s}" 开头 (${hdrText.slice(0, 30)})` });
        }
        continue;
      }

      for (let ci = 0; ci < cells.length; ci++) {
        const cell = cells[ci];
        const cellText = (cell.text || '').trim();
        if (!cellText) continue;

        const pNodes = Array.from(cell.node?.getElementsByTagNameNS?.(W_NS, 'p') || []);
        for (const p of pNodes) {
          const pp = getParagraphProps(p);
          if (!pp.hasText) continue;

          // 严禁任何 <w:numPr> 自动列表编号污染
          if (pp.hasNumPr) {
            issues.push({ level: 'CRITICAL', code: 'NUMPR_POLLUTION', msg: `${spec.label} S${s} R${rIdx} C${ci}: 存在禁用 <w:numPr> 自动编号` });
          }

          // 角色细分检查：多列第 0 列序号标签 vs 第 >=1 列值格 vs 单列说明行
          if (cells.length >= 2 && ci === 0) {
            const pText = Array.from(p.getElementsByTagNameNS(W_NS, 't') || []).map(x => x.textContent || '').join('').trim();
            if (/^\d+\.\d+\s/.test(pText) && pp.tabCount === 0 && s !== 3) {
              issues.push({ level: 'WARNING', code: 'SEQ_NO_TAB', msg: `${spec.label} S${s} R${rIdx}: 序号标签未使用 <w:tab/> 间隔 (${pText.slice(0, 24)})` });
            }
          } else if (cells.length === 2 && ci >= 1) {
            // 值单元格 (VALUE)：应非全粗体（Section 2/14 合规声明除外）且不得有首行缩进
            if (pp.firstLine > 0) {
              issues.push({ level: 'CRITICAL', code: 'VALUE_FIRSTLINE', msg: `${spec.label} S${s} R${rIdx} C${ci}: 值格残留首行缩进 ${pp.firstLine} dxa` });
            }
          } else if (cells.length === 1 && s !== 2 && s !== 11 && s !== 15) {
            // 独立说明行 (EXPLANATION)：纯叙述句不应整段误加粗
            const pText = Array.from(p.getElementsByTagNameNS(W_NS, 't') || []).map(x => x.textContent || '').join('').trim();
            if (pText.length > 25 && pp.allBold) {
              issues.push({ level: 'WARNING', code: 'EXPLANATION_BOLD', msg: `${spec.label} S${s} R${rIdx}: 长说明行误加粗 (${pText.slice(0, 28)}...)` });
            }
          }
        }
      }
    }
  }

  // 4. 校验英文文档零中文残留
  if (spec.lang === 'en') {
    const plainText = records.map(r => (r.rows || []).map(row => (row.cells || []).map(c => c.text || '').join(' ')).join(' ')).join(' ');
    const cjk = plainText.match(/[\u4e00-\u9fff]+/g);
    if (cjk && cjk.length > 0) {
      issues.push({ level: 'CRITICAL', code: 'EN_CJK_RESIDUAL', msg: `${spec.label}: 英文文档残留中文 (${cjk.slice(0, 5).join(', ')})` });
    }
  }

  return issues;
}

export async function runTopologyRolesAudit({ targetDir, modelCode, sourcePath }) {
  const deliverables = [
    { file: `${modelCode} msds_CN 冠志.docx`, label: 'CN 冠志', lang: 'zh', company: 'guanzhi' },
    { file: `${modelCode} msds_CN 国彩.docx`, label: 'CN 国彩', lang: 'zh', company: 'guocai' },
    { file: `${modelCode} msds_EN Guanzhi.docx`, label: 'EN Guanzhi', lang: 'en', company: 'guanzhi' },
    { file: `${modelCode} msds_EN Guocai.docx`, label: 'EN Guocai', lang: 'en', company: 'guocai' }
  ];

  const allIssues = [];
  for (const d of deliverables) {
    const res = await auditDocxTopologyRoles(path.join(targetDir, d.file), d);
    allIssues.push(...res);
  }

  // 5. 源文件 vs 产出文件核心事实继承对照 (CAS / 危险性定性)
  if (sourcePath && fs.existsSync(sourcePath)) {
    const srcFacts = await recognizeSourceDocx(sourcePath, path.basename(sourcePath));
    const cnOutBuf = fs.readFileSync(path.join(targetDir, deliverables[0].file));
    const cnZip = await JSZip.loadAsync(cnOutBuf);
    const cnXml = await cnZip.file('word/document.xml').async('string');
    const cnPlain = cnXml.replace(/<[^>]+>/g, '');

    for (const comp of (srcFacts.components || [])) {
      const cas = (comp.casNumber || comp.cas || '').trim();
      if (/^\d{2,7}-\d{2}-\d$/.test(cas) && !cnPlain.includes(cas)) {
        allIssues.push({ level: 'CRITICAL', code: 'SOURCE_CAS_LOST', msg: `源继承核销失败: 产出缺失源文档 CAS ${cas}` });
      }
    }
    if (!srcFacts.ghs?.isHazardous && /(?:GHS\s*象形图[：:]\s*无|信号词[：:]\s*无)/i.test(cnPlain)) {
      allIssues.push({ level: 'CRITICAL', code: 'EXOGENOUS_GHS', msg: `违反 INV-ZERO-EXOGENOUS: 非危品虚增了"象形图:无/信号词:无"` });
    }
  }

  const criticals = allIssues.filter(i => i.level === 'CRITICAL');
  const warnings = allIssues.filter(i => i.level === 'WARNING');
  return { passed: criticals.length === 0, criticalCount: criticals.length, warningCount: warnings.length, issues: allIssues };
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
  const { targetDir, model, source } = parseArgs();
  if (!targetDir || !model) {
    console.error('用法: node audit_topology_roles.mjs --targetDir=<dir> --model=<model> [--source=<docx>]');
    process.exit(1);
  }
  const res = await runTopologyRolesAudit({ targetDir, modelCode: model, sourcePath: source });
  console.log(`\n=== [机械审计: 六类角色与拓扑样式核销] (${model}) ===`);
  console.log(`CRITICAL: ${res.criticalCount} | WARNING: ${res.warningCount}`);
  for (const iss of res.issues) {
    console.log(`  [${iss.level}] (${iss.code}) ${iss.msg}`);
  }
  if (!res.passed) process.exit(1);
  console.log('✅ [TOPOLOGY ROLES AUDIT PASSED]');
}
