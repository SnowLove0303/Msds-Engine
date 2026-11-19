import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html><body></body></html>');
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '../..');

const { executeEightDeliverablesPipeline } = await import('../src/pipeline-engine.js');
const { runBipolarBilayerAudit } = await import('./audit_bipolar_bilayer.mjs');

const modelCode = 'PA-3654';
const sourcePath = path.resolve(
  REPO_ROOT,
  '算法训练材料/源文件材料/2-1 单组份水性丙烯酸乳液 PA/PA-3654/PA-3654 MSDS（冠志）_源文件留存.docx'
);

const targetDir = path.resolve(
  REPO_ROOT,
  '算法训练材料/TDS MSDS 重写版/02-1 单组份水性丙烯酸乳液 PA/PA-3654'
);

async function main() {
  console.log('========================================================================');
  console.log(`  PA-3654 全套 8 格式标准交付物重新生成 (Universal Engine Pipeline)  `);
  console.log(`  源文件: ${sourcePath}`);
  console.log(`  目标目录: ${targetDir}`);
  console.log('========================================================================\n');

  if (!fsSync.existsSync(sourcePath)) {
    throw new Error(`源文件不存在: ${sourcePath}`);
  }

  const result = await executeEightDeliverablesPipeline({
    modelCode,
    cnGroundTruthPath: sourcePath,
    targetDir,
    facts: {
      isDangerousGoods: false,
      isHazardous: false
    }
  });

  console.log('\n>>> [PIPELINE] 流水线执行完毕:', {
    model: result.model,
    deliverablesCount: result.deliverables?.length,
    durationMs: result.durationMs
  });

  const files = (await fs.readdir(targetDir)).filter(f => /msds/i.test(f) && (f.endsWith('.docx') || f.endsWith('.pdf')));
  console.log(`>>> [DELIVERY] 目标目录实测 MSDS 交付物总数: ${files.length} 个`);
  files.forEach(f => console.log(`   - ${f}`));
  if (files.length !== 8) {
    throw new Error(`MSDS 交付物数量异常: 实测 ${files.length} 个 (期望 8 个)`);
  }

  console.log('\n>>> [AUDIT] 启动双极双层法医主审计中枢...');
  const auditResult = await runBipolarBilayerAudit(targetDir, modelCode);
  console.log('\n>>> [AUDIT] 审计结论:', auditResult);
}

main().catch(err => {
  console.error('\n❌ [ERROR] 生成与审计过程中断:', err);
  process.exit(1);
});
