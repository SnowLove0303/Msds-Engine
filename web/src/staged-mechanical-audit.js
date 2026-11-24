/**
 * 统一分阶段纯确定性机械审计引擎 (staged-mechanical-audit.js)
 *
 * 设计定位 (RTM-01 ~ RTM-03):
 *   1. 纯形式/结构/物理/数学确定性审计：只校验可用代码精确判定的不变量，
 *      彻底剔除特定型号、固定行数与具体法规关键词的硬编码；
 *   2. 分阶段随动前置拦截：支持 Phase 1 (Context 1) -> Phase 2/3 (Context 2) ->
 *      Phase 4 (Topology Ops) -> Phase 5 (4 DOCX) -> Phase 6 (4 PDF) 全链路独立执行；
 *   3. 标准化 JSON 输出：{ ok, stage, summary, findings }，可直接入库至 user_exec_logs.db。
 */

import fs from 'node:fs';
import path from 'node:path';
import { execSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import JSZip from 'jszip';
import { JSDOM } from 'jsdom';
import { DOMParser, XMLSerializer } from '@xmldom/xmldom';
import { loadDocx } from './docx-engine.js';
import { validateCasChecksum } from './cas-validator.js';

if (!globalThis.DOMParser || !globalThis.XMLSerializer) {
  const dom = new JSDOM('<!doctype html><html><body></body></html>');
  globalThis.DOMParser = dom.window.DOMParser;
  globalThis.XMLSerializer = dom.window.XMLSerializer;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const W_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';

function makeCollector(stage) {
  const findings = [];
  let passed = 0;

  const check = (cond, { auditor = `MECH_${stage}`, severity = 'FAIL', ruleId = '', sectionRef = '', title = '', measuredDetail = '' }) => {
    if (cond) {
      passed++;
      return true;
    }
    findings.push({
      auditor,
      severity,
      ruleId,
      sectionRef,
      title,
      measuredDetail: measuredDetail || title
    });
    return false;
  };

  const summarize = () => {
    const critical = findings.filter(f => f.severity === 'CRITICAL').length;
    const fail = findings.filter(f => f.severity === 'FAIL').length;
    const warning = findings.filter(f => f.severity === 'WARNING').length;
    return {
      ok: critical === 0 && fail === 0,
      stage,
      summary: { passed, critical, fail, warning, totalChecked: passed + findings.length },
      findings
    };
  };

  return { check, summarize };
}

/**
 * Phase 1 机械审计: 源文件包完好性与 16 章节抽取覆盖率
 */
export async function auditPhase1Context1({ sourcePath, context1 }) {
  const { check, summarize } = makeCollector('PHASE_1');

  const exists = Boolean(sourcePath && fs.existsSync(sourcePath));
  check(exists, {
    severity: 'CRITICAL',
    ruleId: 'P1_SRC_EXISTS',
    sectionRef: 'Source',
    title: '源文档文件物理存在性校验',
    measuredDetail: exists ? sourcePath : `源文档不存在: ${sourcePath}`
  });

  if (exists) {
    let zipOk = false;
    try {
      const zip = await JSZip.loadAsync(fs.readFileSync(sourcePath));
      zipOk = Boolean(zip.file('word/document.xml'));
    } catch {
      zipOk = false;
    }
    check(zipOk, {
      severity: 'CRITICAL',
      ruleId: 'P1_OPC_VALID',
      sectionRef: 'Source',
      title: '源文档 DOCX OPC/XML 包完好性校验',
      measuredDetail: zipOk ? 'word/document.xml 完整' : '无法解析 word/document.xml'
    });
  }

  const secObj = context1?.sections || {};
  let missingSecs = [];
  for (let s = 1; s <= 16; s++) {
    if (!secObj[s] && !secObj[String(s)]) missingSecs.push(s);
  }
  check(missingSecs.length === 0, {
    severity: 'CRITICAL',
    ruleId: 'P1_16_SECTIONS',
    sectionRef: 'S1~S16',
    title: 'Context 1 十六章节抽取完备性校验',
    measuredDetail: missingSecs.length === 0 ? '16/16 章节完整' : `缺失章节: ${missingSecs.join(',')}`
  });

  return summarize();
}

/**
 * Phase 2 & 3 机械审计: Context 2 结构化治理、数字守恒、零中文与输入文本归一化
 */
export function auditPhase2Context2({ context2 }) {
  const { check, summarize } = makeCollector('PHASE_2_3');

  const valid = Boolean(context2?.validation?.isValid);
  check(valid, {
    severity: 'CRITICAL',
    ruleId: 'P2_CTX2_VALID',
    sectionRef: 'Context2',
    title: 'Context 2 结构化治理 validation.isValid 门禁',
    measuredDetail: `isValid=${context2?.validation?.isValid}, untranslated=${context2?.validation?.untranslatedCount}, numericMismatch=${context2?.validation?.numericMismatchCount}`
  });

  const hasCjkRe = /[\u4e00-\u9fff]/;
  const badSymbolRe = /[≧≦]/;
  const badUnitSpaceRe = /\d+(?:\.\d+)?(?:mm|min|cm|mg|kg|hPa)\b/i;
  const badEnColonRe = /[A-Za-z0-9)\]]\s*：/;
  const badCnTrailingDotRe = /\b(?:mm|min|cm|mg|kg|hPa)\.(?=\s|$|；|;)/i;

  let cjkLeaks = [];
  let badSymbols = [];
  let badUnits = [];
  let badEnColons = [];
  let badTrailingDots = [];

  for (let s = 1; s <= 16; s++) {
    const items = context2?.sections?.[s]?.items || [];
    for (const item of items) {
      if (item.role === 'MIGRATED_TO_S2') continue;
      const cnFields = [item.labelCn, item.valueCn, item.textCn, ...(item.cellsCn || [])].filter(Boolean);
      const enFields = [item.labelEn, item.valueEn, item.textEn, ...(item.cellsEn || [])].filter(Boolean);
      if (Array.isArray(item.lines)) {
        for (const sub of item.lines) {
          if (sub.textCn) cnFields.push(sub.textCn);
          if (sub.textEn) enFields.push(sub.textEn);
        }
      }

      for (const t of enFields) {
        if (hasCjkRe.test(t)) cjkLeaks.push(`S${s}: ${t.slice(0, 30)}`);
        if (badEnColonRe.test(t)) badEnColons.push(`S${s}: ${t.slice(0, 30)}`);
      }
      for (const t of [...cnFields, ...enFields]) {
        if (badSymbolRe.test(t)) badSymbols.push(`S${s}: ${t.slice(0, 30)}`);
        if (badUnitSpaceRe.test(t)) badUnits.push(`S${s}: ${t.slice(0, 30)}`);
      }
      for (const t of cnFields) {
        if (badCnTrailingDotRe.test(t)) badTrailingDots.push(`S${s}: ${t.slice(0, 30)}`);
      }
    }
  }

  check(cjkLeaks.length === 0, {
    severity: 'CRITICAL',
    ruleId: 'P2_EN_ZERO_CJK',
    sectionRef: 'Context2',
    title: 'Context 2 英文槽位零中文残留校验',
    measuredDetail: cjkLeaks.length === 0 ? '零中文残留' : `残留 ${cjkLeaks.length} 处: ${cjkLeaks.slice(0, 3).join('; ')}`
  });
  check(badEnColons.length === 0, {
    severity: 'FAIL',
    ruleId: 'P2_EN_HALF_COLON',
    sectionRef: 'Context2',
    title: 'Context 2 英文标点半角化（零中文全角冒号）',
    measuredDetail: badEnColons.length === 0 ? '全部半角' : `发现 ${badEnColons.length} 处: ${badEnColons.slice(0, 3).join('; ')}`
  });
  check(badSymbols.length === 0, {
    severity: 'FAIL',
    ruleId: 'P2_STD_COMPARATORS',
    sectionRef: 'Context2',
    title: 'Context 2 标准比较符号归一化（禁全角 ≧/≦）',
    measuredDetail: badSymbols.length === 0 ? '全部标准 ≥/≤' : `发现 ${badSymbols.length} 处: ${badSymbols.slice(0, 3).join('; ')}`
  });
  check(badUnits.length === 0, {
    severity: 'FAIL',
    ruleId: 'P2_UNIT_SPACING',
    sectionRef: 'Context2',
    title: 'Context 2 数值与计量单位空格隔离校验',
    measuredDetail: badUnits.length === 0 ? '空格规范' : `发现 ${badUnits.length} 处: ${badUnits.slice(0, 3).join('; ')}`
  });
  check(badTrailingDots.length === 0, {
    severity: 'FAIL',
    ruleId: 'P2_CN_NO_TRAILING_DOT',
    sectionRef: 'Context2',
    title: 'Context 2 中文计量单位末尾零多余句点校验',
    measuredDetail: badTrailingDots.length === 0 ? '纯净无多余句点' : `发现 ${badTrailingDots.length} 处: ${badTrailingDots.slice(0, 3).join('; ')}`
  });

  return summarize();
}

/**
 * Phase 4 机械审计: 拓扑编译操作指令序列合法性与前置清零/Preset 独占锁
 */
export function auditPhase4TopologyOps({ operations = [], presetKey = null }) {
  const { check, summarize } = makeCollector('PHASE_4');

  check(operations.length > 0 && operations[0]?.op === 'clearTemplate', {
    severity: 'CRITICAL',
    ruleId: 'P4_PRE_CLEAR',
    sectionRef: 'Ops[0]',
    title: '前置全模板清零指令校验 (INV-PRE-WRITE-CLEAR)',
    measuredDetail: operations[0]?.op === 'clearTemplate' ? '首位指令为 clearTemplate' : `首条指令为 ${operations[0]?.op}`
  });

  if (presetKey) {
    const lastApplyIdx = operations.map(o => o.op).lastIndexOf('applyPreset');
    const lastWriteIdx = Math.max(
      operations.map(o => o.op).lastIndexOf('writeCell'),
      operations.map(o => o.op).lastIndexOf('morphToFullWidth')
    );
    check(lastApplyIdx > lastWriteIdx, {
      severity: 'CRITICAL',
      ruleId: 'P4_PRESET_PRIORITY',
      sectionRef: 'Preset',
      title: 'Preset 终态独占锁定优先级校验',
      measuredDetail: `lastApplyPreset=${lastApplyIdx}, lastWrite=${lastWriteIdx}`
    });
  }

  return summarize();
}

/**
 * Phase 5 机械审计: 4 份 DOCX 底层 XML 排版几何、边框、CAS、双语对称与双主体隔离
 */
export async function auditPhase5DocxFiles({ targetDir, modelCode }) {
  const { check, summarize } = makeCollector('PHASE_5_DOCX');

  const specs = [
    { key: 'CN_Guanzhi', lang: 'zh', company: 'guanzhi', file: `${modelCode} msds_CN 冠志.docx` },
    { key: 'CN_Guocai', lang: 'zh', company: 'guocai', file: `${modelCode} msds_CN 国彩.docx` },
    { key: 'EN_Guanzhi', lang: 'en', company: 'guanzhi', file: `${modelCode} msds_EN Guanzhi.docx` },
    { key: 'EN_Guocai', lang: 'en', company: 'guocai', file: `${modelCode} msds_EN Guocai.docx` }
  ];

  const loaded = {};
  for (const sp of specs) {
    const fPath = path.join(targetDir, sp.file);
    const exists = fs.existsSync(fPath);
    check(exists, {
      severity: 'CRITICAL',
      ruleId: 'P5_DOCX_EXISTS',
      sectionRef: sp.key,
      title: `DOCX 交付物存在性: ${sp.file}`,
      measuredDetail: exists ? '存在' : `缺失文件: ${fPath}`
    });
    if (!exists) continue;

    const buf = fs.readFileSync(fPath);
    const zip = await JSZip.loadAsync(buf);
    const docXmlStr = await zip.file('word/document.xml')?.async('string') || '';
    const dom = new DOMParser().parseFromString(docXmlStr, 'text/xml');
    const engine = await loadDocx(buf, sp.file);
    loaded[sp.key] = { sp, zip, docXmlStr, dom, engine };

    // 1. 零占位符/示范脏数据残留
    const dirtyMatch = docXmlStr.match(/\{\{[^}]+\}\}|\[型号\]|XXXX|二乙二醇单丁醚|二乙二醇丁醚/);
    check(!dirtyMatch, {
      severity: 'CRITICAL',
      ruleId: 'P5_ZERO_DIRTY_PLACEHOLDER',
      sectionRef: sp.key,
      title: `${sp.key}: 零模板占位符或示范脏数据残留`,
      measuredDetail: dirtyMatch ? `发现残留: ${dirtyMatch[0]}` : '纯净无残留'
    });

    // 2. 页眉页脚与双主体全文档零串扰
    const hfKeys = Object.keys(zip.files).filter(k => /^word\/(?:header|footer)\d+\.xml$/i.test(k));
    let hfText = '';
    for (const k of hfKeys) hfText += await zip.file(k).async('string');
    check(hfKeys.length > 0 && /PAGE/i.test(hfText), {
      severity: 'CRITICAL',
      ruleId: 'P5_HF_PAGE_FIELD',
      sectionRef: `${sp.key} HF`,
      title: `${sp.key}: 页眉页脚与动态 PAGE 页码域校验`,
      measuredDetail: `hfFiles=${hfKeys.length}, hasPAGE=${/PAGE/i.test(hfText)}`
    });

    const forbiddenRe = sp.company === 'guanzhi' ? /国彩|Guocai|0763/i : /冠志|Guanzhi|020-8256/i;
    const leakInDoc = forbiddenRe.test(docXmlStr) || forbiddenRe.test(hfText);
    check(!leakInDoc, {
      severity: 'CRITICAL',
      ruleId: 'P5_ENTITY_ISOLATION',
      sectionRef: sp.key,
      title: `${sp.key}: 双主体企业信息物理隔离校验`,
      measuredDetail: leakInDoc ? '检测到跨企业实体词串流' : '双主体严格隔离'
    });

    // 3. 全局 XML 确定性门禁: 零 numPr, 零非法 <w:tabs>, 值格零 <w:tab/>
    const numPrCount = dom.getElementsByTagName('w:numPr').length;
    check(numPrCount === 0, {
      severity: 'CRITICAL',
      ruleId: 'P5_ZERO_NUMPR',
      sectionRef: sp.key,
      title: `${sp.key}: 表格零 <w:numPr> 自动编号残留`,
      measuredDetail: `numPrCount=${numPrCount}`
    });

    const tbls = Array.from(dom.getElementsByTagName('w:tbl'));
    let illegalTabsCount = 0;
    let valueTabCount = 0;
    for (const tbl of tbls) {
      const trs = Array.from(tbl.getElementsByTagName('w:tr'));
      for (const tr of trs) {
        const tcs = Array.from(tr.getElementsByTagName('w:tc'));
        tcs.forEach((tc, cIdx) => {
          illegalTabsCount += tc.getElementsByTagName('w:tabs').length;
          if (cIdx >= 1) valueTabCount += tc.getElementsByTagName('w:tab').length;
        });
      }
    }
    check(illegalTabsCount === 0 && valueTabCount === 0, {
      severity: 'FAIL',
      ruleId: 'P5_TAB_PURITY',
      sectionRef: sp.key,
      title: `${sp.key}: 制表符纯度校验（零 <w:tabs> 且值格零 <w:tab/>）`,
      measuredDetail: `illegalTabs=${illegalTabsCount}, valueTabs=${valueTabCount}`
    });

    // 4. 英文版零中文残留 & 零英文后全角冒号
    if (sp.lang === 'en') {
      const textOnly = Array.from(dom.getElementsByTagName('w:t')).map(n => n.textContent || '').join('');
      const hasCjk = /[\u4e00-\u9fff]/.test(textOnly);
      const hasBadColon = /[A-Za-z0-9)\]]\s*：/.test(textOnly);
      check(!hasCjk, {
        severity: 'CRITICAL',
        ruleId: 'P5_EN_ZERO_CJK',
        sectionRef: sp.key,
        title: `${sp.key}: 英文交付物零中文字符校验`,
        measuredDetail: hasCjk ? '发现中文字符残留' : '零中文残留'
      });
      check(!hasBadColon, {
        severity: 'FAIL',
        ruleId: 'P5_EN_HALF_COLON',
        sectionRef: sp.key,
        title: `${sp.key}: 英文交付物零中文全角冒号校验`,
        measuredDetail: hasBadColon ? '发现英文后全角冒号' : '全部为西文半角冒号'
      });
    }

    // 5. 16 章节完备性 & S3 居中/CAS 模10 & S13 左对齐 & 外实内虚边框
    const secSet = new Set((engine.records || []).map(r => r.sectionNumber));
    const hasAll16 = Array.from({ length: 16 }, (_, i) => i + 1).every(n => secSet.has(n));
    check(hasAll16, {
      severity: 'CRITICAL',
      ruleId: 'P5_16_SECTIONS',
      sectionRef: sp.key,
      title: `${sp.key}: 16 章节完整存在性`,
      measuredDetail: `coveredSections=${secSet.size}/16`
    });

    const s3 = (engine.records || []).find(r => r.sectionNumber === 3);
    if (s3) {
      let casErrors = 0;
      let nonCenterS3 = 0;
      const tbl3 = tbls[2];
      if (tbl3) {
        const trs3 = Array.from(tbl3.getElementsByTagName('w:tr'));
        for (let r = 3; r < trs3.length; r++) {
          const tcs = Array.from(trs3[r].getElementsByTagName('w:tc'));
          for (const tc of tcs) {
            const jc = tc.getElementsByTagName('w:jc')[0]?.getAttribute('w:val');
            if (jc !== 'center') nonCenterS3++;
          }
          if (r >= 4 && tcs[1]) {
            const casTxt = (tcs[1].textContent || '').trim();
            if (/^\d{2,7}-\d{2}-\d$/.test(casTxt) && !validateCasChecksum(casTxt)) casErrors++;
          }
        }
      }
      check(nonCenterS3 === 0, {
        severity: 'FAIL',
        ruleId: 'P5_S3_CENTER',
        sectionRef: `${sp.key} S3`,
        title: `${sp.key}: Section 3 成分网格居中对齐`,
        measuredDetail: `nonCenterCells=${nonCenterS3}`
      });
      check(casErrors === 0, {
        severity: 'CRITICAL',
        ruleId: 'P5_S3_CAS_CHECKSUM',
        sectionRef: `${sp.key} S3`,
        title: `${sp.key}: Section 3 CAS 号加权模 10 校验`,
        measuredDetail: `casErrors=${casErrors}`
      });
    }

    const tbl13 = tbls[12];
    if (tbl13) {
      const trs13 = Array.from(tbl13.getElementsByTagName('w:tr'));
      const lastTr = trs13[trs13.length - 1];
      const tcs13 = lastTr ? Array.from(lastTr.getElementsByTagName('w:tc')) : [];
      const jc0 = tcs13[0]?.getElementsByTagName('w:jc')[0]?.getAttribute('w:val');
      const jc1 = tcs13[1]?.getElementsByTagName('w:jc')[0]?.getAttribute('w:val');
      check(jc0 === 'left' && (jc1 === 'left' || (sp.lang === 'zh' && jc1 === 'both')), {
        severity: 'FAIL',
        ruleId: 'P5_S13_FLUSH_LEFT',
        sectionRef: `${sp.key} S13`,
        title: `${sp.key}: Section 13 末行处理方法左对齐校验`,
        measuredDetail: `c0=${jc0}, c1=${jc1}`
      });
    }

    // 6. 字体字阶均一性 (EN 全篇 sz=19，豁免 Section 9 黄金标尺序号 sz=21)
    if (sp.lang === 'en') {
      let non19 = 0;
      for (let tIdx = 0; tIdx < tbls.length; tIdx++) {
        const tbl = tbls[tIdx];
        const trs = Array.from(tbl.getElementsByTagName('w:tr'));
        for (let r = 1; r < trs.length; r++) {
          const runs = Array.from(trs[r].getElementsByTagName('w:r'));
          for (const rNode of runs) {
            const rTxt = (rNode.textContent || '').trim();
            const isS9Seq = (tIdx === 8) && /^9\.\d+$/.test(rTxt);
            const szs = Array.from(rNode.getElementsByTagName('w:sz'));
            for (const sNode of szs) {
              const v = sNode.getAttribute('w:val');
              if (v && v !== '19' && !(isS9Seq && v === '21')) non19++;
            }
          }
        }
      }
      check(non19 === 0, {
        severity: 'FAIL',
        ruleId: 'P5_EN_FONT_SZ19',
        sectionRef: sp.key,
        title: `${sp.key}: 英文全篇表格字阶均一性校验 (sz=19)`,
        measuredDetail: `non19Count=${non19}`
      });
    }
  }

  // 7. 中英文 16 章节表格行数 1:1 严格对称
  if (loaded.CN_Guanzhi && loaded.EN_Guanzhi) {
    const diffs = [];
    for (let s = 1; s <= 16; s++) {
      const cnRec = loaded.CN_Guanzhi.engine.records.find(r => r.sectionNumber === s);
      const enRec = loaded.EN_Guanzhi.engine.records.find(r => r.sectionNumber === s);
      const cnLen = cnRec?.rows?.length || 0;
      const enLen = enRec?.rows?.length || 0;
      const cnHasProdCnName = s === 1 && Boolean(cnRec?.rows?.some(r => /^(?:产品)?中文名称[：:]?$/i.test((r.cells?.[0]?.text || '').trim())));
      const expectedEnLen = cnHasProdCnName ? cnLen - 1 : cnLen;
      if (expectedEnLen !== enLen) diffs.push(`S${s}(CN=${cnLen},EN=${enLen})`);
    }
    check(diffs.length === 0, {
      severity: 'CRITICAL',
      ruleId: 'P5_BILINGUAL_ROW_SYMMETRY',
      sectionRef: 'S1~S16',
      title: '中英文 16 章节表格行数 1:1 对称校验',
      measuredDetail: diffs.length === 0 ? '16/16 章节严格对称' : `不对称章节: ${diffs.join(', ')}`
    });
  }

  // 8. 双列 KV 行左侧标签非空校验 (防止插入新行漏写 cell 0 标签导致无主值行)
  for (const [spKey, entry] of Object.entries(loaded)) {
    const eng = entry?.engine;
    if (!eng) continue;
    const emptyLabelHits = [];
    for (const rec of (eng.records || [])) {
      const s = rec.sectionNumber;
      if (!s || s === 2 || s === 3 || s === 16) continue;
      for (let rIdx = 1; rIdx < (rec.rows || []).length; rIdx++) {
        const cells = rec.rows[rIdx]?.cells || [];
        if (cells.length === 2) {
          const c0 = (cells[0]?.text || '').trim();
          const c1 = (cells[1]?.text || '').trim();
          if (!c0 && c1) {
            emptyLabelHits.push(`S${s}:R${rIdx}(val=${c1.slice(0, 16)})`);
          }
        }
      }
    }
    check(emptyLabelHits.length === 0, {
      severity: 'CRITICAL',
      ruleId: 'P5_KV_LABEL_NON_EMPTY',
      sectionRef: spKey,
      title: `${spKey}: 双列 KV 行左侧标签非空校验`,
      measuredDetail: emptyLabelHits.length === 0 ? '0 处无主值行' : emptyLabelHits.slice(0, 5).join(', ')
    });

    // 9. 双列 KV 未编号标签垂直齐平校验 & 垂直居中校验 (防止 S1/S8/S13 未编号标签带 hanging/firstLine 锯齿及 S11/S13 居上错位)
    const indentHits = [];
    const valignHits = [];
    for (const rec of (eng.records || [])) {
      const s = rec.sectionNumber;
      if (!s || s === 2 || s === 3 || s === 16) continue;
      for (let rIdx = 1; rIdx < (rec.rows || []).length; rIdx++) {
        const cells = rec.rows[rIdx]?.cells || [];
        if (cells.length !== 2) continue;
        const c0 = cells[0];
        const c1 = cells[1];
        const t0 = (c0?.text || '').trim();
        if (c0?.node && t0 && !/^\d+\.\d+/.test(t0)) {
          const ind = c0.node.getElementsByTagName('w:ind')?.[0];
          const hanging = ind?.getAttribute('w:hanging');
          const firstLine = ind?.getAttribute('w:firstLine');
          if (hanging || firstLine) {
            indentHits.push(`S${s}:R${rIdx}(H=${hanging || 0},F=${firstLine || 0})`);
          }
        }
        [c0, c1].forEach((c, ci) => {
          if (c?.node) {
            const va = c.node.getElementsByTagName('w:vAlign')?.[0]?.getAttribute('w:val');
            if (va !== 'center') {
              valignHits.push(`S${s}:R${rIdx}:C${ci}(vAlign=${va || 'default'})`);
            }
          }
        });
      }
    }
    check(indentHits.length === 0, {
      severity: 'FAIL',
      ruleId: 'P5_LABEL_INDENT_ALIGN',
      sectionRef: spKey,
      title: `${spKey}: 未编号 KV 标签首字垂直齐平校验 (无 hanging/firstLine 锯齿)`,
      measuredDetail: indentHits.length === 0 ? '0 处缩进锯齿' : indentHits.slice(0, 5).join(', ')
    });
    check(valignHits.length === 0, {
      severity: 'FAIL',
      ruleId: 'P5_KV_VALIGN_CENTER',
      sectionRef: spKey,
      title: `${spKey}: 双列 KV 单元格垂直居中校验 (vAlign=center)`,
      measuredDetail: valignHits.length === 0 ? '100% 垂直居中' : valignHits.slice(0, 5).join(', ')
    });

    // @FIX_TAG(2026-11-23/staged-mechanical-audit/FIX-NO-JUSTIFY-BOTH): 10. 禁止两端对齐 (both/distribute) 与多段落标签续行缩进校验
    const bothHits = [];
    const contIndentHits = [];
    for (const rec of (eng.records || [])) {
      const s = rec.sectionNumber;
      if (!s) continue;
      for (let rIdx = 1; rIdx < (rec.rows || []).length; rIdx++) {
        const cells = rec.rows[rIdx]?.cells || [];
        cells.forEach((cell, ci) => {
          if (!cell?.node) return;
          const ps = Array.from(cell.node.getElementsByTagName('w:p'));
          ps.forEach((p, pi) => {
            const jc = p.getElementsByTagName('w:jc')?.[0]?.getAttribute('w:val');
            if (jc === 'both' || jc === 'distribute') {
              bothHits.push(`S${s}:R${rIdx}:C${ci}:P${pi}(${jc})`);
            }
          });
          if (ci === 0 && cells.length >= 2 && s !== 9 && ps.length > 1) {
            const t0 = (ps[0]?.textContent || '').trim();
            if (/^\d+\.\d+/.test(t0)) {
              for (let pi = 1; pi < ps.length; pi++) {
                const pt = (ps[pi]?.textContent || '').trim();
                if (!pt) continue;
                const cInd = ps[pi].getElementsByTagName('w:ind')?.[0];
                const leftVal = Number(cInd?.getAttribute('w:left') || 0);
                if (leftVal < 400) {
                  contIndentHits.push(`S${s}:R${rIdx}:P${pi}(left=${leftVal})`);
                }
              }
            }
          }
        });
      }
    }
    check(bothHits.length === 0, {
      severity: 'FAIL',
      ruleId: 'P5_NO_JUSTIFY_BOTH',
      sectionRef: spKey,
      title: `${spKey}: 禁止表体使用两端对齐 (both/distribute)`,
      measuredDetail: bothHits.length === 0 ? '0 处两端对齐' : bothHits.slice(0, 5).join(', ')
    });
    check(contIndentHits.length === 0, {
      severity: 'FAIL',
      ruleId: 'P5_LABEL_CONTINUATION_INDENT',
      sectionRef: spKey,
      title: `${spKey}: 多段落带序号标签续行缩进垂线齐平校验`,
      measuredDetail: contIndentHits.length === 0 ? '0 处续行挂在序号下' : contIndentHits.slice(0, 5).join(', ')
    });

    // @FIX_TAG(2026-11-23/staged-mechanical-audit/FIX-DUP-SEQ-LABEL): 11. 防止改写 cell 0 标签时新旧序号标签文本叠加拼接 (如 S9 "9.3...9.4...")
    const dupSeqHits = [];
    for (const rec of (eng.records || [])) {
      const s = rec.sectionNumber;
      if (!s || s === 2 || s === 14 || s === 16) continue;
      for (let rIdx = 1; rIdx < (rec.rows || []).length; rIdx++) {
        const c0Txt = (rec.rows[rIdx]?.cells?.[0]?.text || '').trim();
        const matches = c0Txt.match(/\b\d+\.\d+\b/g) || [];
        if (matches.length >= 2) {
          dupSeqHits.push(`S${s}:R${rIdx}(${matches.join(',')})`);
        }
      }
    }
    check(dupSeqHits.length === 0, {
      severity: 'CRITICAL',
      ruleId: 'P5_NO_DUPLICATE_SEQ_IN_LABEL',
      sectionRef: spKey,
      title: `${spKey}: 左侧标签单元格防重拼接校验`,
      measuredDetail: dupSeqHits.length === 0 ? '0 处重复序号拼接' : dupSeqHits.slice(0, 5).join(', ')
    });
  }

  // @FIX_TAG(2026-11-23/staged-mechanical-audit/FIX-BILINGUAL-SEQ-SYMMETRY): 12. 中英文双语子序号 1:1 对称校验 (防止如 S7 7.1/7.2 或 S8 8.1/8.2 在 CN 丢失而 EN 存在)
  for (const [cnKey, enKey] of [['CN_Guanzhi', 'EN_Guanzhi'], ['CN_Guocai', 'EN_Guocai']]) {
    const cnEng = loaded[cnKey]?.engine;
    const enEng = loaded[enKey]?.engine;
    if (!cnEng || !enEng) continue;
    const seqMismatches = [];
    for (const s of [1, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]) {
      const getSeqs = (eng) => {
        const rec = (eng.records || []).find(r => r.sectionNumber === s);
        if (!rec) return [];
        const out = [];
        for (let rIdx = 1; rIdx < (rec.rows || []).length; rIdx++) {
          const c0 = (rec.rows[rIdx]?.cells?.[0]?.text || '').trim();
          const m = c0.match(/^(\d+\.\d+)/);
          if (m) out.push(m[1]);
        }
        return out;
      };
      const cnSeqs = getSeqs(cnEng);
      const enSeqs = getSeqs(enEng);
      if (cnSeqs.join(',') !== enSeqs.join(',')) {
        seqMismatches.push(`S${s}(CN=[${cnSeqs.join(',')}] vs EN=[${enSeqs.join(',')}])`);
      }
    }
    check(seqMismatches.length === 0, {
      severity: 'CRITICAL',
      ruleId: 'P5_BILINGUAL_SEQ_SYMMETRY',
      sectionRef: `${cnKey}<->${enKey}`,
      title: `${cnKey}/${enKey}: 中英文各章节子序号 1:1 对称校验`,
      measuredDetail: seqMismatches.length === 0 ? '100% 双语子序号对称' : seqMismatches.join('; ')
    });

    // @FIX_TAG(2026-11-23/staged-mechanical-audit/FIX-BILINGUAL-ROW-PARITY): 13. 中英文 S2~S16 逐行结构、列数与数字基准 1:1 对称校验
    const rowParityHits = [];
    for (let s = 2; s <= 16; s++) {
      const cnRec = (cnEng.records || []).find(r => r.sectionNumber === s);
      const enRec = (enEng.records || []).find(r => r.sectionNumber === s);
      const cnRows = cnRec?.rows || [];
      const enRows = enRec?.rows || [];
      if (cnRows.length !== enRows.length) {
        rowParityHits.push(`S${s}(rows:${cnRows.length}!=${enRows.length})`);
        continue;
      }
      for (let rIdx = 1; rIdx < cnRows.length; rIdx++) {
        const cCells = cnRows[rIdx]?.cells || [];
        const eCells = enRows[rIdx]?.cells || [];
        if (cCells.length !== eCells.length) {
          rowParityHits.push(`S${s}:R${rIdx}(cols:${cCells.length}!=${eCells.length})`);
          continue;
        }
        const cNums = (cCells.map(c => c.text || '').join(' ').replace(/^(\d+\.\d+)/gm, '').match(/\d+(?:\.\d+)?/g) || []);
        const eStr = eCells.map(c => c.text || '').join(' ').replace(/^(\d+\.\d+)/gm, '');
        const eNums = eStr.match(/\d+(?:\.\d+)?/g) || [];
        const missing = cNums.filter(n => !eNums.includes(n));
        if (missing.length > 0) {
          rowParityHits.push(`S${s}:R${rIdx}(numMissing:[${missing.join(',')}])`);
        }
      }
    }
    check(rowParityHits.length === 0, {
      severity: 'CRITICAL',
      ruleId: 'P5_BILINGUAL_ROW_PARITY',
      sectionRef: `${cnKey}<->${enKey}`,
      title: `${cnKey}/${enKey}: 中英文 S2~S16 逐行结构/列数/数字 1:1 对称校验`,
      measuredDetail: rowParityHits.length === 0 ? '100% 双语逐行对称' : rowParityHits.slice(0, 5).join('; ')
    });
  }

  // @FIX_TAG(2026-11-24/staged-mechanical-audit/FIX-S2-NO-RENUMBER): 14. Section 2 序号统一从 .1 开始且防双 2.1 校验
  for (const [spKey, entry] of Object.entries(loaded)) {
    const eng = entry?.engine;
    if (!eng) continue;
    const s2Rec = (eng.records || []).find(r => r.sectionNumber === 2);
    const s2Text = (s2Rec?.rows || []).slice(1).map(r => (r.cells || []).map(c => c.text || '').join('\n')).join('\n');
    const has20 = /^\s*2\.0\b/m.test(s2Text);
    const hasOverview21 = /^\s*2\.1\s*(?:紧急情况概述|Emergency\s+overview)/im.test(s2Text);
    const seq21Count = (s2Text.match(/^\s*2\.1\b/gm) || []).length;
    const badS2Seq = has20 || (hasOverview21 && seq21Count > 1);
    check(!badS2Seq, {
      severity: 'CRITICAL',
      ruleId: 'P5_S2_NO_DUPLICATE_SEQ',
      sectionRef: `${spKey}:S2`,
      title: `${spKey}: Section 2 序号统一从 .1 开始且防重复校验`,
      measuredDetail: badS2Seq ? `检测到异常序号 (has20=${has20}, seq21Count=${seq21Count})` : '2.1/2.2/2.3/2.4 序号规范无重复'
    });

    // @FIX_TAG(2026-11-24/staged-mechanical-audit/FIX-S2-LABEL-BOLD): 15. Section 2 节标题与子标签加粗一致性校验
    const s2Unbolded = [];
    const s2Ps = s2Rec?.rows?.[1]?.cells?.[0]?.node ? Array.from(s2Rec.rows[1].cells[0].node.getElementsByTagName('w:p')) : [];
    for (const p of s2Ps) {
      const pt = (p.textContent || '').trim();
      if (/^(?:2\.\d+\s*(?:紧急情况概述|Emergency\s+overview|物质或混合物的分类|Classification\s+of\s+the\s+substance\s+or\s+mixture|标签要素|Label\s+elements|其他危险|其他危害|Other\s+hazards)|GHS[-\s]*危险性类别|GHS\s+Hazard\s+(?:Categories|classification)|GHS[-\s]*象形图|GHS\s+Pictograms)/i.test(pt)) {
        const firstRun = p.getElementsByTagName('w:r')?.[0];
        const hasBold = firstRun && firstRun.getElementsByTagName('w:b').length > 0;
        if (!hasBold) s2Unbolded.push(pt.slice(0, 35));
      }
    }
    check(s2Unbolded.length === 0, {
      severity: 'FAIL',
      ruleId: 'P5_S2_LABEL_BOLD_SYMMETRY',
      sectionRef: `${spKey}:S2`,
      title: `${spKey}: Section 2 标签角色自动加粗校验`,
      measuredDetail: s2Unbolded.length === 0 ? 'Section 2 全部节标题/标签已加粗' : s2Unbolded.join(', ')
    });

    // @FIX_TAG(2026-11-24/staged-mechanical-audit/FIX-S2-INDENT-HIERARCHY): 16. Section 2 四级缩进几何一致校验 (父标题=0, 子标签=480/317, 子标签的子标签=840/677, 深层P码=1200/1037)
    const isEnDoc = spKey.startsWith('EN_');
    const expBase = isEnDoc ? 317 : 480;
    const expSubVal = isEnDoc ? 677 : 840;
    const expDeepVal = isEnDoc ? 1037 : 1200;
    const s2IndentBad = [];
    let s2Lvl = 1;
    for (const p of s2Ps) {
      const pt = (p.textContent || '').trim();
      if (!pt) continue;
      const pInd = p.getElementsByTagName('w:ind')?.[0];
      const leftVal = Number(pInd?.getAttribute('w:left') || 0);
      const isParent = /^(?:2\.\d+\s*(?:紧急情况概述|Emergency\s+overview|物质或混合物的?分类|Classification\s+of\s+the\s+substance\s+or\s+mixture|标签要素|Label\s+elements|危险性说明|危害性说明|Hazard\s+statements?|防范说明|Precautionary\s+statements?|其他危险|其他危害|Other\s+hazards)|物质或混合物的?分类|Classification\s+of\s+the\s+substance\s+or\s+mixture)[：:]?$/i.test(pt);
      const isSubSub = /^(?:预防措施|事故响应|安全储存|安全存储|废弃处置|Prevention|Response|Storage|Disposal)(?:[：:]|$)/i.test(pt);
      const isSub = !isSubSub && /^(?:(?:GHS[-\s]*)?(?:危险性?类别|危险性?分类|分类|Hazard\s*categories|Hazard\s*classification|象形图|pictograms?)|信号词|警告词|Signal\s*word|必须列在标签上的有害成[份分]|Hazardous\s+components\s+(?:which\s+must\s+|to\s+)?be\s+listed\s+on\s+the\s+label|危险性说明|危害性说明|Hazard\s*statements?|防范说明|Precautionary\s*statements?)(?:[：:]|$)/i.test(pt);
      if (isParent) {
        s2Lvl = 1;
        if (leftVal !== 0) s2IndentBad.push(`Parent(${pt.slice(0, 15)},left=${leftVal})`);
      } else if (isSubSub) {
        s2Lvl = 3;
        if (leftVal !== expSubVal) s2IndentBad.push(`SubSubLabel(${pt.slice(0, 15)},left=${leftVal}!=${expSubVal})`);
      } else if (isSub) {
        s2Lvl = 2;
        if (leftVal !== expBase) s2IndentBad.push(`SubLabel(${pt.slice(0, 15)},left=${leftVal}!=${expBase})`);
      } else if (!/^\[(?:象形图|Pictogram)\]/i.test(pt)) {
        const expected = s2Lvl === 3 ? expDeepVal : (s2Lvl === 2 ? expSubVal : expBase);
        if (leftVal !== expected) s2IndentBad.push(`Val(lvl=${s2Lvl},${pt.slice(0, 15)},left=${leftVal}!=${expected})`);
      }
    }
    check(s2IndentBad.length === 0, {
      severity: 'FAIL',
      ruleId: 'P5_S2_INDENT_HIERARCHY',
      sectionRef: `${spKey}:S2`,
      title: `${spKey}: Section 2 三级缩进层级一致校验`,
      measuredDetail: s2IndentBad.length === 0 ? 'Section 2 父标题/子标签/值缩进 100% 统一' : s2IndentBad.slice(0, 5).join(', ')
    });

    // 16b. Section 2 P 码四大子标签完整性校验 (存在 P2/P3/P4/P5 时必须具备 预防措施/事故响应/安全储存/废弃处置)
    const s2TextAll = s2Ps.map(p => (p.textContent || '').trim());
    const missingPSubs = [];
    if (s2TextAll.some(t => /^P2\d+/i.test(t)) && !s2TextAll.some(t => /^(?:预防措施|Prevention)[：:]?$/i.test(t))) missingPSubs.push('预防措施/Prevention');
    if (s2TextAll.some(t => /^P3\d+/i.test(t)) && !s2TextAll.some(t => /^(?:事故响应|Response)[：:]?$/i.test(t))) missingPSubs.push('事故响应/Response');
    if (s2TextAll.some(t => /^P4\d+/i.test(t)) && !s2TextAll.some(t => /^(?:安全储存|安全存储|Storage)[：:]?$/i.test(t))) missingPSubs.push('安全储存/Storage');
    if (s2TextAll.some(t => /^P5\d+/i.test(t)) && !s2TextAll.some(t => /^(?:废弃处置|Disposal)[：:]?$/i.test(t))) missingPSubs.push('废弃处置/Disposal');
    check(missingPSubs.length === 0, {
      severity: 'FAIL',
      ruleId: 'P5_S2_P_SUBLABELS',
      sectionRef: `${spKey}:S2`,
      title: `${spKey}: Section 2 P 码四大子标签完整性校验`,
      measuredDetail: missingPSubs.length === 0 ? 'S2 P2xx/P3xx/P4xx/P5xx 子标签完整' : `缺失子标签: ${missingPSubs.join(', ')}`
    });

    // 16c. Section 2 "必须列在标签上的有害成分" 不得裸露空置 (无具体成分时应补全为 "：无" / ": None")
    const bareHazComp = s2TextAll.some(t => /^(?:必须列在标签上的有害成[份分]|Hazardous\s+components\s+(?:which\s+must\s+|to\s+)?be\s+listed\s+on\s+the\s+label)[：:]?$/i.test(t));
    check(!bareHazComp, {
      severity: 'FAIL',
      ruleId: 'P5_S2_HAZARDOUS_COMP_NO_EMPTY',
      sectionRef: `${spKey}:S2`,
      title: `${spKey}: 必须列在标签上的有害成分非空兜底校验`,
      measuredDetail: bareHazComp ? '存在空置的 必须列在标签上的有害成分 标签（应补全：无 / None）' : '必须列在标签上的有害成分已含具体值或“无/None”'
    });

    // 17. Section 8 控制参数父标签必须位于工作场所组分控制参数说明行之前
    const s8Rec = eng.records.find(r => r.sectionNumber === 8);
    if (s8Rec) {
      const s8Rows = s8Rec.rows || [];
      const ctrlIdx = s8Rows.findIndex(r => /^(?:\d+\.\d+[\s\t]*)?(?:控制参数|Control\s*parameters)/i.test((r.cells?.[0]?.text || '').trim()));
      const wpIdx = s8Rows.findIndex(r => /工作场所组分控制参数|Workplace\s+component\s+control\s+parameters/i.test((r.cells?.[0]?.text || '').trim()));
      const s8OrderOk = !(ctrlIdx >= 0 && wpIdx >= 0 && ctrlIdx > wpIdx);
      check(s8OrderOk, {
        severity: 'FAIL',
        ruleId: 'P5_S8_CONTROL_BEFORE_OEL',
        sectionRef: `${spKey}:S8`,
        title: `${spKey}: Section 8 控制参数父标签置顶于组分控制参数之前`,
        measuredDetail: s8OrderOk ? `ctrlRow=${ctrlIdx}, workplaceRow=${wpIdx}` : `控制参数(R${ctrlIdx})错误排在工作场所组分控制参数(R${wpIdx})之后`
      });

      // 17b. Section 8 OEL 数据行 (物质名如丙二醇甲醚醋酸酯) 为值格，严禁加粗
      const oelHdrIdx = s8Rows.findIndex(r => /^(?:物质|Substance)$/i.test((r.cells?.[0]?.text || '').trim()));
      const boldOelRows = oelHdrIdx >= 0
        ? s8Rows.slice(oelHdrIdx + 1).filter(r => {
            const c0 = r.cells?.[0];
            if (!c0 || !(c0.text || '').trim()) return false;
            const r0 = c0.node?.getElementsByTagName('w:r')?.[0];
            return Boolean(r0 && r0.getElementsByTagName('w:b').length > 0);
          })
        : [];
      check(boldOelRows.length === 0, {
        severity: 'FAIL',
        ruleId: 'P5_S8_OEL_VALUE_UNBOLDED',
        sectionRef: `${spKey}:S8`,
        title: `${spKey}: Section 8 OEL 组分值行非加粗校验`,
        measuredDetail: boldOelRows.length === 0 ? 'S8 OEL 数据行首列为常规非加粗值样式' : `发现 ${boldOelRows.length} 行 OEL 数据行首列仍加粗`
      });
    }

    if (isEnDoc) {
      const s1Rec = eng.records.find(r => r.sectionNumber === 1);
      const hasProdCnName = Boolean(s1Rec?.rows?.some(r => /Product\s*Chinese\s*name/i.test((r.cells?.[0]?.text || '').trim())));
      check(!hasProdCnName, {
        severity: 'FAIL',
        ruleId: 'P5_EN_NO_PRODUCT_CHINESE_NAME',
        sectionRef: `${spKey}:S1`,
        title: `${spKey}: 英文拓扑取消 Product Chinese name 校验`,
        measuredDetail: hasProdCnName ? 'EN S1 仍残留 Product Chinese name 行' : 'EN S1 已取消 Product Chinese name'
      });
    }

    // 19. 页眉页脚型号匹配校验 (严禁残留模板默认 PEA-4139)
    const hdrText = (eng.headerFooterRecords || [])
      .map(r => (r.rows || []).flatMap(rw => (rw.cells || []).map(c => c.text || '')).join(' '))
      .join(' ') || JSON.stringify(eng.headerFooterData || {});
    const hasModelInHf = modelCode ? hdrText.toUpperCase().includes(modelCode.toUpperCase()) : true;
    const hasStalePea = modelCode && modelCode.toUpperCase() !== 'PEA-4139' && /PEA-4139/i.test(hdrText);
    check(hasModelInHf && !hasStalePea, {
      severity: 'FAIL',
      ruleId: 'P5_HF_MODEL_MATCH',
      sectionRef: `${spKey}:HF`,
      title: `${spKey}: 页眉页脚型号与防串模校验`,
      measuredDetail: (hasModelInHf && !hasStalePea) ? `页眉页脚已准确绑定 ${modelCode}` : `页眉页脚型号异常 (hasModel=${hasModelInHf}, stalePEA=${hasStalePea})`
    });

    // 20. 16 章节标题序号完整性校验 (防止类似 S1 "Identification" 漏号复发)
    const missingSecNums = [];
    for (let s = 1; s <= 16; s++) {
      const hTxt = (eng.records.find(r => r.sectionNumber === s)?.rows?.[0]?.cells?.[0]?.text || '').trim();
      if (hTxt && !new RegExp(`^${s}\\s*[.．、]`).test(hTxt)) {
        missingSecNums.push(`S${s}(${hTxt.slice(0, 20)})`);
      }
    }
    check(missingSecNums.length === 0, {
      severity: 'FAIL',
      ruleId: 'P5_SECTION_HEADER_NUMBERS',
      sectionRef: `${spKey}:S1~S16`,
      title: `${spKey}: 16 章节标题序号完整性校验`,
      measuredDetail: missingSecNums.length === 0 ? '16/16 章节标题均带完整序号' : `缺失序号: ${missingSecNums.join(', ')}`
    });

    // 21. 关键细节防漏译校验 (TR-02 S10.2 products / TR-03 S13 national standards / TR-04 S13 may / TR-06 S16 other process)
    if (isEnDoc) {
      const enFullText = eng.records.flatMap(r => (r.rows || []).flatMap(rw => (rw.cells || []).map(c => c.text || ''))).join('\n');
      const transFails = [];
      if (/10\.2\s*Hazardous decomposition[:：\s]*$/im.test(enFullText)) transFails.push('S10.2缺products');
      if (loaded.CN_Guanzhi) {
        const cnFullText = loaded.CN_Guanzhi.engine.records.flatMap(r => (r.rows || []).flatMap(rw => (rw.cells || []).map(c => c.text || ''))).join('\n');
        if (/国标/.test(cnFullText) && !/national standards/i.test(enFullText)) transFails.push('S13漏译national standards');
        if (/可根据化学工业/.test(cnFullText) && !/\bMay be disposed of\b/i.test(enFullText)) transFails.push('S13漏译may');
        if (/其它制程/.test(cnFullText) && (!/other process/i.test(enFullText) || !/otherwise specified/i.test(enFullText))) transFails.push('S16漏译other/otherwise');
      }
      check(transFails.length === 0, {
        severity: 'FAIL',
        ruleId: 'P5_TRANSLATION_FIDELITY',
        sectionRef: `${spKey}:TRANS`,
        title: `${spKey}: 关键细节零漏译防复发校验`,
        measuredDetail: transFails.length === 0 ? 'S10.2/S13/S16 全部细节完整忠实翻译' : transFails.join(', ')
      });
    }
    const s14Rec = eng.records.find(r => r.sectionNumber === 14);
    if (s14Rec) {
      const packedS14 = (s14Rec.rows || []).filter(r => {
        const c0t = (r.cells?.[0]?.text || '').trim();
        const matches = c0t.match(/14\.\d+/g) || [];
        return new Set(matches).size >= 2;
      });
      check(packedS14.length === 0, {
        severity: 'FAIL',
        ruleId: 'P5_S14_NO_PACKED_MULTI_SEQ',
        sectionRef: `${spKey}:S14`,
        title: `${spKey}: Section 14 子项独立成行校验`,
        measuredDetail: packedS14.length === 0 ? 'Section 14 全部 14.x 子项已独立成行' : `发现 ${packedS14.length} 行仍挤入多个 14.x 子项`
      });
    }
  }

  return summarize();
}

/**
 * Phase 6 机械审计: 8 格式全矩阵完整性、时间戳同步与 PyMuPDF 物理坐标/字号/末页防空
 */
export function auditPhase6PdfFiles({ targetDir, modelCode }) {
  const { check, summarize } = makeCollector('PHASE_6_PDF');

  const expected = [
    `${modelCode} msds_CN 冠志.docx`,
    `${modelCode} msds_CN 冠志.pdf`,
    `${modelCode} msds_CN 国彩.docx`,
    `${modelCode} msds_CN 国彩.pdf`,
    `${modelCode} msds_EN Guanzhi.docx`,
    `${modelCode} msds_EN Guanzhi.pdf`,
    `${modelCode} msds_EN Guocai.docx`,
    `${modelCode} msds_EN Guocai.pdf`
  ];

  const mtimes = [];
  const pdfPaths = [];
  for (const name of expected) {
    const p = path.join(targetDir, name);
    const ex = fs.existsSync(p);
    check(ex, {
      severity: 'CRITICAL',
      ruleId: 'P6_MATRIX_EXISTS',
      sectionRef: 'Deliverables',
      title: `8 格式交付物存在性: ${name}`,
      measuredDetail: ex ? '存在' : `缺失: ${p}`
    });
    if (ex) {
      mtimes.push(fs.statSync(p).mtimeMs);
      if (name.endsWith('.pdf')) pdfPaths.push(p);
    }
  }

  if (mtimes.length === 8) {
    const spreadSec = (Math.max(...mtimes) - Math.min(...mtimes)) / 1000;
    check(spreadSec <= 300, {
      severity: 'CRITICAL',
      ruleId: 'P6_TIMESTAMP_SYNC',
      sectionRef: 'Deliverables',
      title: '8 份交付物物理时间戳同步性校验 (<= 300s)',
      measuredDetail: `差值: ${spreadSec.toFixed(1)} 秒`
    });
  }

  if (pdfPaths.length === 4) {
    const quotedPdfs = pdfPaths.map(p => `"${p}"`).join(' ');
    const anchorPy = path.resolve(__dirname, '../scripts/check_pdf_golden_anchor_alignment.py');
    if (fs.existsSync(anchorPy)) {
      const res = spawnSync('python', [anchorPy, ...pdfPaths], { encoding: 'utf8' });
      check(res.status === 0, {
        severity: 'FAIL',
        ruleId: 'P6_PDF_GOLDEN_ANCHOR',
        sectionRef: 'PDF Coords',
        title: 'PDF 黄金标尺物理坐标实测 (Tier A=80.28pt, Tier B=87.28pt)',
        measuredDetail: res.status === 0 ? '4 份 PDF 全量对齐通过' : `${res.stdout || ''} ${res.stderr || ''}`.trim().slice(0, 300)
      });
    }

    const s9Py = path.resolve(__dirname, '../scripts/check_pdf_s9_alignment.py');
    if (fs.existsSync(s9Py)) {
      const res = spawnSync('python', [s9Py, ...pdfPaths], { encoding: 'utf8' });
      check(res.status === 0, {
        severity: 'FAIL',
        ruleId: 'P6_PDF_S9_ALIGN',
        sectionRef: 'PDF S9',
        title: 'PDF Section 9 标签首字垂线物理对齐校验',
        measuredDetail: res.status === 0 ? '4 份 PDF Section 9 垂线通过' : `${res.stdout || ''} ${res.stderr || ''}`.trim().slice(0, 300)
      });
    }

    // 末页防纯空白页检查 (PyMuPDF)
    const blankCheckPy = `import sys, pymupdf\nbad=[]\nfor p in sys.argv[1:]:\n  d=pymupdf.open(p)\n  if len(d)>0 and not d[-1].get_text('text').strip(): bad.append(p)\nprint('OK' if not bad else 'BLANK:'+','.join(bad))\nsys.exit(1 if bad else 0)`;
    const blankRes = spawnSync('python', ['-c', blankCheckPy, ...pdfPaths], { encoding: 'utf8' });
    check(blankRes.status === 0, {
      severity: 'CRITICAL',
      ruleId: 'P6_PDF_NO_BLANK_LAST_PAGE',
      sectionRef: 'PDF Pages',
      title: 'PDF 末页防纯空白页校验',
      measuredDetail: (blankRes.stdout || blankRes.stderr || '').trim()
    });
  }

  return summarize();
}

/**
 * 统一分阶段机械审计入口
 */
export async function runStagedMechanicalAudit({
  stage = 'all',
  sourcePath = null,
  context1 = null,
  context2 = null,
  operations = null,
  presetKey = null,
  targetDir = null,
  modelCode = null
}) {
  const results = [];
  if ((stage === 'all' || stage === 'phase1') && (sourcePath || context1)) {
    results.push(await auditPhase1Context1({ sourcePath, context1 }));
  }
  if ((stage === 'all' || stage === 'context2') && context2) {
    results.push(auditPhase2Context2({ context2 }));
  }
  if ((stage === 'all' || stage === 'ops') && Array.isArray(operations)) {
    results.push(auditPhase4TopologyOps({ operations, presetKey }));
  }
  if ((stage === 'all' || stage === 'docx') && targetDir && modelCode) {
    results.push(await auditPhase5DocxFiles({ targetDir, modelCode }));
  }
  if ((stage === 'all' || stage === 'pdf') && targetDir && modelCode) {
    results.push(auditPhase6PdfFiles({ targetDir, modelCode }));
  }

  const allFindings = results.flatMap(r => r.findings);
  const summary = {
    passed: results.reduce((a, r) => a + r.summary.passed, 0),
    critical: allFindings.filter(f => f.severity === 'CRITICAL').length,
    fail: allFindings.filter(f => f.severity === 'FAIL').length,
    warning: allFindings.filter(f => f.severity === 'WARNING').length
  };
  return {
    ok: summary.critical === 0 && summary.fail === 0,
    stage,
    summary,
    stagesExecuted: results.map(r => r.stage),
    findings: allFindings
  };
}
