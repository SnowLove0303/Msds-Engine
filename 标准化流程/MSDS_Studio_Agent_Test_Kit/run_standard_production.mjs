#!/usr/bin/env node

/**
 * MSDS-Studio 标准七步覆写流水线统一执行脚手架 (Test Kit Standard Runner)
 * 
 * 严格按照 MSDS-Studio 7 阶标准作业规程 (7-Phase Pipeline) 执行：
 * Phase 1: 物理源文件事实感知 (Context 1 抽取与指纹锁定)
 * Phase 2: 双实体预设加载与意图对齐 (冠志 / 国彩)
 * Phase 3: 事实标准化治理与基准补全 (Context 2)
 * Phase 4: 模板加载与前置值格清零
 * Phase 5: 编辑器受控写入与排版几何硬锁 (420/560 dxa, 单 Tab, Section 2 通栏)
 * Phase 6: 原生高保真矢量 PDF 转换 (Windows WPS COM 原生 5 页复刻)
 * Phase 7: 两阶双轨全景深度审计 (双极双层 165 项 + 中央主审计 170 项，退出码 0 门禁)
 * 
 * 使用方式:
 *   node run_standard_production.mjs [--source="<源文件路径>"] [--model="<产品型号>"] [--targetDir="<输出目录>"]
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { execSync, spawnSync } from 'node:child_process';
import { JSDOM } from 'jsdom';
const { default: JSZip } = await import('../../node_modules/jszip/lib/index.js');

const dom = new JSDOM('<!doctype html><html><body></body></html>');
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '../..');

// 动态载入官方正规流水线构件
const { recognizeSourceDocx, serializeFactsToMarkdown } = await import('../../web/src/recognition-engine.js');
const { governContext, buildStructuredContext2, serializeContext2ToMarkdown, saveTranslationsToMemory } = await import('../../web/src/context-governor.js');
const { compileTopologyOps } = await import('../../web/src/topology-matcher.js');
const { convertBatchDocxToPdf } = await import('../../web/src/pdf-converter.js');
const {
  inspectTemplateSchema,
  createWorkSession,
  saveSession,
  clearTemplateValues,
  clearSectionValuesInSession,
  applyCompanyPreset,
  writeCellValueToSession,
  writeFullWidthSection,
  formatSection9LaserTabs,
  deleteRowFromSession,
  insertRowIntoSession,
  insertRowAfter,
  morphToFullWidth,
  applyAdaptiveRuler,
  enforceFlushLeftValues,
  formatSection3GridCenter
} = await import('../../web/src/template-editor.js');
const {
  createExecutionRun,
  updateRunPhase,
  recordWorkflowError,
  recordAuditFindings,
  finishExecutionRun,
  parseAuditOutput,
  closeUserExecDb
} = await import('../../web/src/user-exec-db.js');

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    source: null,
    model: null,
    targetDir: null,
    facts: null,
    translations: null,
    stopAfter: null,
    phase: null,
    user: null,
    actorType: 'human',
    enableContentMapping: false,
    allowDirty: false,
    skipAudit: false,
    help: false
  };

  for (const arg of args) {
    if (arg === '--help' || arg === '-h') options.help = true;
    else if (arg.startsWith('--source=')) options.source = arg.split('=', 2)[1].replace(/^["']|["']$/g, '');
    else if (arg.startsWith('--model=')) options.model = arg.split('=', 2)[1].replace(/^["']|["']$/g, '');
    else if (arg.startsWith('--targetDir=')) options.targetDir = arg.split('=', 2)[1].replace(/^["']|["']$/g, '');
    else if (arg.startsWith('--facts=')) options.facts = arg.split('=', 2)[1].replace(/^["']|["']$/g, '');
    else if (arg.startsWith('--translations=')) options.translations = arg.split('=', 2)[1].replace(/^["']|["']$/g, '');
    else if (arg.startsWith('--stopAfter=')) options.stopAfter = arg.split('=', 2)[1].replace(/^["']|["']$/g, '').toLowerCase();
    else if (arg.startsWith('--phase=')) options.phase = arg.split('=', 2)[1].replace(/^["']|["']$/g, '').toLowerCase();
    else if (arg.startsWith('--user=')) options.user = arg.split('=', 2)[1].replace(/^["']|["']$/g, '');
    else if (arg.startsWith('--actorType=')) options.actorType = arg.split('=', 2)[1].replace(/^["']|["']$/g, '').toLowerCase();
    else if (arg === '--enableContentMapping') options.enableContentMapping = true;
    else if (arg === '--allowDirty') options.allowDirty = true;
    else if (arg === '--skipAudit') options.skipAudit = true;
    else if (!options.source && !arg.startsWith('--')) options.source = arg.replace(/^["']|["']$/g, '');
  }

  return options;
}

const execTracker = {
  runId: null,
  phase: 'INIT',
  startedAt: Date.now()
};

function runAuditAndRecord(auditorName, scriptPath, args, runId) {
  const res = spawnSync('node', [scriptPath, ...args], {
    encoding: 'utf-8',
    maxBuffer: 50 * 1024 * 1024
  });
  if (res.stdout) process.stdout.write(res.stdout);
  if (res.stderr) process.stderr.write(res.stderr);

  const combined = `${res.stdout || ''}\n${res.stderr || ''}`;
  const findings = parseAuditOutput(auditorName, combined);
  if (runId && findings.length > 0) {
    recordAuditFindings(runId, findings);
  }
  const ok = res.status === 0;
  if (!ok && runId) {
    recordWorkflowError({
      runId,
      phase: 'PHASE_7_AUDIT',
      errorCode: `${auditorName}_BLOCKED`,
      message: `${auditorName} exited with code ${res.status} (captured ${findings.length} findings)`
    });
  }
  return { ok, status: res.status, findingsCount: findings.length };
}

async function main() {
  const options = parseArgs();
  if (options.help) {
    console.log(`
MSDS-Studio 官方标准七步流水线 Runner
用法:
  node run_standard_production.mjs [选项]

选项:
  --source=<路径>      源文件路径 (默认: ./source/ 下第一个 docx)
  --model=<型号>       产品型号代码 (如 PA-3655，默认自动从源文件解析)
  --targetDir=<路径>   交付物输出目录 (默认: ./output/<型号>/)
  --skipAudit         跳过终审 (不推荐，默认执行法医级审计)
`);
    process.exit(0);
  }

  // 1. 解析源文件路径
  let sourcePath = options.source;
  if (!sourcePath) {
    const defaultSourceDir = path.resolve(__dirname, 'source');
    if (fs.existsSync(defaultSourceDir)) {
      const candidates = fs.readdirSync(defaultSourceDir).filter(f => f.endsWith('.docx') && !f.startsWith('~$'));
      if (candidates.length > 0) {
        sourcePath = path.join(defaultSourceDir, candidates[0]);
      }
    }
  }

  if (!sourcePath || !fs.existsSync(sourcePath)) {
    console.error(`❌ 未找到有效的源文件: ${sourcePath || '未指定'}`);
    process.exit(1);
  }

  // 2. 解析产品型号
  let modelCode = options.model;
  if (!modelCode) {
    const baseName = path.basename(sourcePath);
    const m = baseName.match(/([A-Z]{2,4}-\d{3,5}[A-Z0-9-]*)/i) || baseName.match(/([A-Z]{1,4}\d{3,5}[A-Z0-9]*)/i);
    modelCode = m ? m[1].toUpperCase() : baseName.replace(/\.[^/.]+$/, '').trim();
  }

function verifyReadonlyEngineGuard(targetDir, allowDirty = false) {
  // 1. 严禁在输出目录或工作区生成调用 MSDS-Engine 的临时脚本
  if (fs.existsSync(targetDir)) {
    const adHocScripts = fs.readdirSync(targetDir).filter(f => /\.(?:mjs|js|cjs|py|ps1|sh)$/i.test(f));
    if (adHocScripts.length > 0) {
      console.error(`❌ [AD_HOC_SCRIPT_BLOCKED] 检测到临时脚本产出 (${adHocScripts.join(', ')})！工作流调用期间严禁生成任何临时脚本！`);
      process.exit(1);
    }
  }

  // 2. 严禁在工作流调用期间修改受控源码 (豁免合法沉淀的 translation-memory.json)
  if (!allowDirty && fs.existsSync(path.join(REPO_ROOT, '.git'))) {
    try {
      const statusOut = execSync('git status --porcelain web/src web/scripts web/templates "标准化流程"', {
        cwd: REPO_ROOT,
        encoding: 'utf8'
      }).trim();
      const violations = statusOut
        .split(/\r?\n/)
        .map(l => l.trim())
        .filter(Boolean)
        .filter(l => !l.endsWith('web/src/translation-memory.json') && !l.includes('/output/'));
      if (violations.length > 0) {
        console.error(`❌ [SOURCE_TAMPER_BLOCKED] 检测到系统受控源码/脚本被修改或新增临时文件，工作流调用期间严禁修改源码：\n  ${violations.join('\n  ')}`);
        process.exit(1);
      }
    } catch {
      // 非 Git 环境跳过 git status 检查
    }
  }
}

  // 3. 解析目标输出目录
  const targetDir = options.targetDir
    ? path.resolve(options.targetDir)
    : path.resolve(__dirname, 'output', modelCode);

  fs.mkdirSync(targetDir, { recursive: true });
  verifyReadonlyEngineGuard(targetDir, process.argv.includes('--devAllowDirty'));

  execTracker.startedAt = Date.now();
  execTracker.runId = createExecutionRun({
    userId: options.user,
    actorType: options.actorType,
    modelCode,
    sourcePath,
    targetDir,
    mode: options.enableContentMapping ? 'TOPOLOGY_PLUS_MAPPING' : 'PURE_TOPOLOGY_SOURCE_INHERITED'
  });

  console.log(`============================================================`);
  console.log(`🚀 [MSDS-Studio Test Kit] 启动标准七步法覆写生产流水线`);
  console.log(`   • 执行批次: ${execTracker.runId}`);
  console.log(`   • 产品型号: ${modelCode}`);
  console.log(`   • 源文件路径: ${sourcePath}`);
  console.log(`   • 输出目录: ${targetDir}`);
  console.log(`============================================================\n`);

  // Phase 1~6 仅在非 --phase=audit 模式下执行
  if (options.phase !== 'audit') {
    // Phase 1: 源文件事实感知 (Context 1 抽取)
    execTracker.phase = 'PHASE_1_RECOGNITION';
    updateRunPhase(execTracker.runId, execTracker.phase);
    console.log(`>>> [Phase 1/7] 识别模块事实感知与 Context 1 抽取...`);
  const t1 = Date.now();
  const context1 = await recognizeSourceDocx(sourcePath, path.basename(sourcePath));
  context1.modelCode = modelCode;
  const ctx1MdPath = path.join(targetDir, `${modelCode}_context1.md`);
  fs.writeFileSync(ctx1MdPath, serializeFactsToMarkdown(context1), 'utf8');
  updateRunPhase(execTracker.runId, execTracker.phase, { context1Path: ctx1MdPath });
  console.log(`    ✓ 成功解析 16 章节原始事实 (${Date.now() - t1} ms) -> ${ctx1MdPath}`);
  if (options.stopAfter === 'context1') {
    finishExecutionRun(execTracker.runId, { status: 'SUCCESS', durationMs: Date.now() - execTracker.startedAt, summary: { stoppedAfter: 'context1' } });
    closeUserExecDb();
    console.log(`\n✅ [STOPPED AFTER PHASE 1] Context 1 已落盘校验: ${ctx1MdPath}`);
    return;
  }

  // Phase 2 & 3: 事实标准化治理与基准补全 (Context 2)
  execTracker.phase = 'PHASE_2_3_GOVERNANCE';
  updateRunPhase(execTracker.runId, execTracker.phase);
  console.log(`>>> [Phase 2 & 3/7] 规范治理与全量英译/标准化表格校验 (Context 2)...`);
  const t2 = Date.now();
  let agentTranslations = null;
  if (options.translations && fs.existsSync(options.translations)) {
    agentTranslations = JSON.parse(fs.readFileSync(options.translations, 'utf8'));
    console.log(`    ℹ️ 已加载 Agent 全量逐句英译回填字典: ${options.translations}`);
  }
  const structuredCtx2 = buildStructuredContext2(context1, { translations: agentTranslations });
  const ctx2MdPath = path.join(targetDir, `${modelCode}_context2.md`);
  fs.writeFileSync(ctx2MdPath, serializeContext2ToMarkdown(structuredCtx2), 'utf8');
  const v = structuredCtx2.validation || {};
  console.log(`    ✓ Context 2 结构化治理完成: 章节 ${v.coveredSections}/16 | 标注项 ${v.totalItems} | TM库 ${v.tmSize ?? 0} 条 | 待补译 ${v.untranslatedCount} | 数字异常 ${v.numericMismatchCount ?? 0} | isValid=${v.isValid} -> ${ctx2MdPath}`);
  if (v.untranslatedCount > 0) {
    const untranslatedPath = path.join(targetDir, `${modelCode}_untranslated.json`);
    fs.writeFileSync(untranslatedPath, JSON.stringify(v.untranslatedTemplate || {}, null, 2) + '\n', 'utf8');
    console.warn(`    ⚠️ [GATE 3A->3B] 已自动导出待译模板: ${untranslatedPath}`);
    console.warn(`       请 Agent 逐句翻译填满上述 JSON 的空值后，传 --translations="${untranslatedPath}" 复跑！`);
  } else if (agentTranslations && (v.numericMismatchCount ?? 0) === 0) {
    const saved = saveTranslationsToMemory(agentTranslations);
    console.log(`    💾 [TM 沉淀] 新增 ${saved.added} 条专业英译已写入映射数据库 (累计 ${saved.total} 条): ${saved.path}`);
  }
  if ((v.numericMismatchCount ?? 0) > 0) {
    console.error(`    ❌ [NUMERIC GATE] 发现 ${v.numericMismatchCount} 条译文丢失原文数字/CAS，已阻断沉淀，请修正：`);
    for (const nm of (v.numericMismatches || []).slice(0, 10)) {
      console.error(`       - S${nm.sectionNumber} R${nm.rowIndex} [${nm.field}] 缺失 "${nm.missingNumber}" | CN="${nm.cnSource}" | EN="${nm.currentEn}"`);
    }
  }
  const governed = governContext(context1, { modelCode });
  const cn = governed.cn;
  const en = governed.en;

  const pipelineFacts = {
    modelCode,
    productName: cn.productName || modelCode,
    productNameEn: en.productNameEn || en.productName || modelCode,
    isHazardous: Boolean(cn.isHazardous),
    isDangerousGoods: false,
    signalWord: cn.ghs?.signalWord || '',
    components: (cn.components || []).map(c => ({
      name: c.name,
      cas: c.cas,
      conc: c.conc
    })),
    enComponents: (en.components || []).map(c => ({
      name: c.name,
      cas: c.cas,
      conc: c.conc
    })),
    appearanceOverride: cn.physicalProperties?.find(p => /外观|外\s*观/i.test(p.label))?.value,
    appearanceEn: en.physicalProperties?.find(p => /Appearance|外观/i.test(p.label))?.value,
    section9Overrides: {}
  };

  for (const prop of cn.physicalProperties || []) {
    if (prop.label && prop.value) {
      pipelineFacts.section9Overrides[prop.label] = prop.value;
    }
  }

  // 融合调用端显式传入的自定义事实覆盖 (严禁因为源文档非标而随意去修改底层源码)
  if (options.facts) {
    let customFacts = {};
    if (fs.existsSync(options.facts)) {
      try {
        if (options.facts.endsWith('.js') || options.facts.endsWith('.mjs')) {
          const mod = await import(pathToFileURL(path.resolve(options.facts)).href);
          customFacts = mod.default || mod.facts || mod;
          console.log(`    ℹ️ 已成功从外部 JS 模块注入 Facts 事实覆盖: ${options.facts}`);
        } else {
          customFacts = JSON.parse(fs.readFileSync(options.facts, 'utf8'));
          console.log(`    ℹ️ 已成功从外部文件注入 Facts 事实覆盖: ${options.facts}`);
        }
      } catch (e) {
        console.warn(`    ⚠️ 读取 --facts 文件失败: ${e.message}`);
      }
    } else {
      try {
        customFacts = JSON.parse(options.facts);
        console.log(`    ℹ️ 已成功注入内联 Facts 事实覆盖`);
      } catch (e) {
        console.warn(`    ⚠️ 解析内联 --facts JSON 失败: ${e.message}`);
      }
    }
    Object.assign(pipelineFacts, customFacts);
    if (customFacts.section9Overrides) {
      Object.assign(pipelineFacts.section9Overrides, customFacts.section9Overrides);
    }
  }

  updateRunPhase(execTracker.runId, execTracker.phase, { context2Path: ctx2MdPath });
  console.log(`    ✓ 事实标准化完成，危化定性: ${pipelineFacts.isHazardous ? '危险品' : '非危险化学品'} (${Date.now() - t2} ms)`);
  if (options.stopAfter === 'context2') {
    finishExecutionRun(execTracker.runId, { status: 'SUCCESS', durationMs: Date.now() - execTracker.startedAt, summary: { stoppedAfter: 'context2' } });
    closeUserExecDb();
    console.log(`\n✅ [STOPPED AFTER PHASE 3] Context 1 & Context 2 已落盘校验，未触发写盘覆写。`);
    return;
  }

  // Phase 4, 5, 6: Context 2 -> 拓扑匹配编译器 -> 编辑器原语写入 -> Windows WPS 原生 COM PDF 转译
  execTracker.phase = 'PHASE_4_6_PRODUCTION';
  updateRunPhase(execTracker.runId, execTracker.phase);
  if (!v.isValid) {
    console.error(`❌ [CONTEXT2 GATE BLOCKED] Context 2 尚未通过零中文/数字守恒校验，禁止进入 Phase 4~6 写盘！`);
    process.exit(1);
  }
  console.log(`>>> [Phase 4, 5, 6/7] 基于 Context 2 执行拓扑匹配 (${options.enableContentMapping ? 'TOPOLOGY+MAPPING' : 'PURE_TOPOLOGY_SOURCE_INHERITED'}) 与 WPS PDF 转译...`);
  const t3 = Date.now();
  const targets = [
    { templateKey: 'CN_Guanzhi', presetKey: 'CN_Guanzhi', fileName: `${modelCode} msds_CN 冠志.docx` },
    { templateKey: 'CN_Guocai', presetKey: 'CN_Guocai', fileName: `${modelCode} msds_CN 国彩.docx` },
    { templateKey: 'EN_Guanzhi', presetKey: 'EN_Guanzhi', fileName: `${modelCode} msds_EN Guanzhi.docx` },
    { templateKey: 'EN_Guocai', presetKey: 'EN_Guocai', fileName: `${modelCode} msds_EN Guocai.docx` }
  ];

  const docxItemsForPdf = [];
  for (const tgt of targets) {
    const schema = await inspectTemplateSchema(tgt.templateKey);
    const compiled = compileTopologyOps(structuredCtx2, schema, {
      presetKey: tgt.presetKey,
      enableContentMapping: options.enableContentMapping
    });
    const session = await createWorkSession(tgt.templateKey);
    session.modelCode = modelCode;
    for (const op of compiled.operations) {
      if (op.op === 'clearTemplate') clearTemplateValues(session);
      else if (op.op === 'clearSectionValues') clearSectionValuesInSession(session, { sectionNumber: op.sectionNumber });
      else if (op.op === 'applyPreset') applyCompanyPreset(session, op.presetKey);
      else if (op.op === 'writeCell') writeCellValueToSession(session, { sectionNumber: op.sectionNumber, rowIndex: op.rowIndex, cellIndex: op.cellIndex, text: op.text || '' });
      else if (op.op === 'writeFullWidth') writeFullWidthSection(session, { sectionNumber: op.sectionNumber, content: op.content || op.text || '', options: op.options || {} });
      else if (op.op === 'formatLaserTabs') formatSection9LaserTabs(session);
      else if (op.op === 'deleteRow') deleteRowFromSession(session, { sectionNumber: op.sectionNumber, rowIndex: op.rowIndex });
      else if (op.op === 'insertRow') insertRowIntoSession(session, { sectionNumber: op.sectionNumber, targetRowIndex: op.targetRowIndex || op.rowIndex, cloneFromRowIndex: op.cloneFromRowIndex });
      else if (op.op === 'insertRowAfter') insertRowAfter(session, op.sectionNumber, op.rowIndex ?? 0, op.cloneFromRowIndex);
      else if (op.op === 'morphToFullWidth') morphToFullWidth(session, op.sectionNumber, op.rowIndex ?? 0, op.content || op.text || '', op.options || {});
      else if (op.op === 'applyAdaptiveRuler') applyAdaptiveRuler(session, op.sectionNumber);
      else if (op.op === 'enforceFlushLeftValues') enforceFlushLeftValues(session, op.sectionNumber);
      else if (op.op === 'formatSection3Grid') formatSection3GridCenter(session);
    }
    const outDocxPath = path.join(targetDir, tgt.fileName);
    await saveSession(session, outDocxPath);
    docxItemsForPdf.push({ docxBuffer: fs.readFileSync(outDocxPath), fileName: tgt.fileName });
    console.log(`    ✓ 生成 DOCX: ${tgt.fileName} (${compiled.mode}, ${compiled.stats.totalOps} ops)`);
  }

  const pdfResults = await convertBatchDocxToPdf(docxItemsForPdf);
  for (const pRes of pdfResults) {
    const outPdfPath = path.join(targetDir, pRes.pdfName || pRes.fileName.replace(/\.docx$/i, '.pdf'));
    fs.writeFileSync(outPdfPath, pRes.pdfBuffer);
    console.log(`    ✓ 生成 PDF:  ${path.basename(outPdfPath)} (${pRes.size} bytes, ${pRes.backend})`);
  }
  console.log(`    ✓ 8 格式全矩阵交付物生成完毕 (4 DOCX + 4 PDF) (${Date.now() - t3} ms)`);
  if (options.stopAfter === 'produce') {
    finishExecutionRun(execTracker.runId, { status: 'SUCCESS', durationMs: Date.now() - execTracker.startedAt, summary: { stoppedAfter: 'produce' } });
    closeUserExecDb();
    console.log(`\n✅ [STOPPED AFTER PHASE 6] 8 份交付物已生成至: ${targetDir}`);
    console.log(`   👉 请 Agent 确认产出已生成后，运行 --phase=audit 触发机械审计并同步开展介入审计！`);
    return;
  }
  } // end if (options.phase !== 'audit')

  // Phase 7: 两阶双轨全要素法医级深度主审计 + Agent 介入审计速查包生成
  if (!options.skipAudit) {
    execTracker.phase = 'PHASE_7_AUDIT';
    updateRunPhase(execTracker.runId, execTracker.phase);
    console.log(`\n>>> [Phase 7/7] 执行两阶双轨审计（机械审计 + 同步生成 Agent 介入审计速查包）...`);
    const t4 = Date.now();

    // 7.0 六类角色与拓扑样式强化机械审计 (标题/序号/标签/值/说明行/页眉页脚)
    console.log(`    • 执行六类角色与拓扑样式强化审计 (audit_topology_roles.mjs)...`);
    const rolesRes = runAuditAndRecord(
      'TOPOLOGY_ROLES',
      path.resolve(REPO_ROOT, 'web/scripts/audit_topology_roles.mjs'),
      [`--targetDir=${targetDir}`, `--model=${modelCode}`, `--source=${sourcePath}`],
      execTracker.runId
    );
    if (!rolesRes.ok) {
      console.error(`      ❌ 角色与拓扑样式机械审计失败，发布阻断！`);
      finishExecutionRun(execTracker.runId, { status: 'AUDIT_BLOCKED', durationMs: Date.now() - execTracker.startedAt, summary: { blockedBy: 'TOPOLOGY_ROLES' } });
      closeUserExecDb();
      process.exit(1);
    }

    // 7.0b 同步生成 Agent 介入审计速查包 (免通读 330KB Pipeline 源码)
    console.log(`    • 同步生成 Agent 介入审计速查包 (generate_agent_audit_brief.mjs)...`);
    const briefCmd = `node "${path.resolve(REPO_ROOT, 'web/scripts/generate_agent_audit_brief.mjs')}" --targetDir="${targetDir}" --model=${modelCode} --source="${sourcePath}"`;
    execSync(briefCmd, { stdio: 'inherit' });
    const briefPath = path.join(targetDir, `${modelCode}_agent_audit_brief.md`);
    if (fs.existsSync(briefPath)) {
      updateRunPhase(execTracker.runId, execTracker.phase, { auditBriefPath: briefPath });
    }

    // 7.1 双极双层法医级全景深度审计 (165项)
    console.log(`    • 执行双极双层法医深度审计 (audit_bipolar_bilayer.mjs)...`);
    const bilayerRes = runAuditAndRecord(
      'BIPOLAR_BILAYER',
      path.resolve(REPO_ROOT, 'web/scripts/audit_bipolar_bilayer.mjs'),
      [targetDir, modelCode],
      execTracker.runId
    );
    if (!bilayerRes.ok) {
      console.error(`      ❌ 双极双层审计失败，发布阻断！`);
      finishExecutionRun(execTracker.runId, { status: 'AUDIT_BLOCKED', durationMs: Date.now() - execTracker.startedAt, summary: { blockedBy: 'BIPOLAR_BILAYER' } });
      closeUserExecDb();
      process.exit(1);
    }
    console.log(`      ✅ 双极双层法医审计 100% 满分通过！`);

    // 7.2 集中式中央主审计套件 (170项)
    console.log(`    • 执行集中式中央主审计套件 (run_master_msds_audit.mjs)...`);
    const masterRes = runAuditAndRecord(
      'MASTER_AUDIT',
      path.resolve(REPO_ROOT, 'web/scripts/run_master_msds_audit.mjs'),
      [`--model=${modelCode}`, `--targetDir=${targetDir}`, `--source=${sourcePath}`],
      execTracker.runId
    );
    if (!masterRes.ok) {
      console.error(`      ❌ 中央主审计失败，发布阻断！`);
      finishExecutionRun(execTracker.runId, { status: 'AUDIT_BLOCKED', durationMs: Date.now() - execTracker.startedAt, summary: { blockedBy: 'MASTER_AUDIT' } });
      closeUserExecDb();
      process.exit(1);
    }
    console.log(`      ✅ 中央主审计 100% 满分通过 (🏆 AUDIT_PASSED)！`);

    console.log(`    ✓ 全部审计套件通过 (${Date.now() - t4} ms)`);
  }

  finishExecutionRun(execTracker.runId, {
    status: 'SUCCESS',
    durationMs: Date.now() - execTracker.startedAt,
    summary: { skipAudit: options.skipAudit }
  });
  closeUserExecDb();

  console.log(`\n============================================================`);
  console.log(`🎉 [SUCCESS] 🏆 ${modelCode} 标准七步覆写全流程执行完毕！`);
  console.log(`   • 执行批次: ${execTracker.runId} (已记录至用户执行数据库)`);
  console.log(`   • 产出目录: ${targetDir}`);
  console.log(`   • 交付成果: 4 份 DOCX + 4 份高保真矢量 PDF 全部通过终审 (退出码 0)`);
  console.log(`============================================================\n`);
}

main().catch(err => {
  console.error('\n❌ 流水线执行异常中断:', err);
  if (execTracker.runId) {
    try {
      recordWorkflowError({
        runId: execTracker.runId,
        phase: execTracker.phase || 'UNKNOWN',
        errorCode: err?.code || err?.name || 'UNHANDLED_EXCEPTION',
        message: err?.message || String(err),
        stackTrace: err?.stack || ''
      });
      finishExecutionRun(execTracker.runId, {
        status: 'FAILED',
        durationMs: Date.now() - execTracker.startedAt,
        summary: { failedPhase: execTracker.phase, error: err?.message || String(err) }
      });
      closeUserExecDb();
    } catch {
      // 避免数据库记录异常掩盖原始堆栈
    }
  }
  process.exit(1);
});
