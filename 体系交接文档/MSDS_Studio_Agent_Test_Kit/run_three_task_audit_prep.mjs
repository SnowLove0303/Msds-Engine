#!/usr/bin/env node

/**
 * MSDS-Studio Agent 三任务审计前置采集器 (Test Kit)
 *
 * 1. 默认模式：调用 generate_context3_report.mjs 生成单文件合并 Context 3 报告；
 * 2. --universalAudit 模式：调用纯 L2 通用识别 (recognizeDocumentUniversal) 与 L2 9层拓扑识别
 *    (recognizeTemplateTopology)，为任务 1（1:1 内容审计）与任务 2（9 层拓扑参数审计）生成标准输入。
 */

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { recognizeDocumentUniversal, serializeUniversalToMarkdown } from '../../web/src/recognition-engine.js';
import { recognizeTemplateTopology } from '../../web/src/template-topology-recognizer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const GENERATOR = path.resolve(__dirname, '../../web/scripts/generate_context3_report.mjs');

const args = process.argv.slice(2);
if (args.length === 0 || args.includes('--help')) {
  console.log('用法:');
  console.log('  node run_three_task_audit_prep.mjs --model=<MODEL> --source=<SOURCE_DOCX> --cn=<CN_DOCX> --en=<EN_DOCX> --out=<OUT_MD>');
  console.log('  node run_three_task_audit_prep.mjs --universalAudit --source=<SOURCE_DOCX> --target=<OUTPUT_DOCX> [--template=<TPL_DOCX>] [--outDir=<DIR>]');
  process.exit(0);
}

if (args.includes('--universalAudit')) {
  const getArg = (prefix) => {
    const hit = args.find((a) => a.startsWith(prefix));
    return hit ? hit.slice(prefix.length).replace(/^["']|["']$/g, '') : null;
  };
  const sourcePath = getArg('--source=');
  const targetPath = getArg('--target=');
  const templatePath = getArg('--template=');
  const outDir = path.resolve(getArg('--outDir=') || path.resolve(__dirname, 'output/universal_audit'));
  fs.mkdirSync(outDir, { recursive: true });

  const summary = { generatedAt: new Date().toISOString(), source: null, target: null, template: null };
  if (sourcePath && fs.existsSync(sourcePath)) {
    const srcUni = await recognizeDocumentUniversal(sourcePath, { sourceName: path.basename(sourcePath) });
    fs.writeFileSync(path.join(outDir, 'source_universal.json'), JSON.stringify(srcUni, null, 2));
    fs.writeFileSync(path.join(outDir, 'source_content_1to1.md'), serializeUniversalToMarkdown(srcUni));
    summary.source = { tables: srcUni.tables.length, cells: srcUni.coverage.normalizedCellCount };
  }
  if (targetPath && fs.existsSync(targetPath)) {
    const tgtUni = await recognizeDocumentUniversal(targetPath, { sourceName: path.basename(targetPath) });
    const tgtTopo = await recognizeTemplateTopology(targetPath, { templateName: path.basename(targetPath) });
    fs.writeFileSync(path.join(outDir, 'target_universal.json'), JSON.stringify(tgtUni, null, 2));
    fs.writeFileSync(path.join(outDir, 'target_content_1to1.md'), serializeUniversalToMarkdown(tgtUni));
    fs.writeFileSync(path.join(outDir, 'target_topology_9layer.json'), JSON.stringify(tgtTopo, null, 2));
    summary.target = {
      tables: tgtUni.tables.length,
      cells: tgtUni.coverage.normalizedCellCount,
      topologySections: tgtTopo.sectionsCount,
      completenessCheck: tgtTopo.completenessCheck
    };
  }
  if (templatePath && fs.existsSync(templatePath)) {
    const tplTopo = await recognizeTemplateTopology(templatePath, { templateName: path.basename(templatePath) });
    fs.writeFileSync(path.join(outDir, 'template_topology_9layer.json'), JSON.stringify(tplTopo, null, 2));
    summary.template = { topologySections: tplTopo.sectionsCount, completenessCheck: tplTopo.completenessCheck };
  }
  fs.writeFileSync(path.join(outDir, 'universal_audit_prep_summary.json'), JSON.stringify(summary, null, 2));
  console.log('✅ [UNIVERSAL_AUDIT_PREP]', JSON.stringify(summary));
  process.exit(0);
}

const res = spawnSync('node', [GENERATOR, ...args], { stdio: 'inherit' });
process.exit(res.status ?? 1);
