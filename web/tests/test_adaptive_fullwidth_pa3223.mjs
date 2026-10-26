import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { JSDOM } from 'jsdom';

const dom = new JSDOM();
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

const { executeEightDeliverablesPipeline } = await import('../src/pipeline-engine.js');

const execFileAsync = promisify(execFile);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const targetDir = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/PA-3223';
const sourceDocxPath = path.join(targetDir, 'PA-3223 msds_CN 冠志_源文件留存.docx');

async function testPa3223FullPipeline() {
  console.log('>>> [TEST] 开始运行 PA-3223 自适应通栏复合模态流水线回归测试...');

  const sourceBuffer = await fs.readFile(sourceDocxPath);

  // 1. 运行流水线生成 8 格式标准交付物 (含 Gate 1~9 门禁)
  const result = await executeEightDeliverablesPipeline({
    modelCode: 'PA-3223',
    cnGroundTruthPath: sourceDocxPath,
    cnGroundTruthBuffer: sourceBuffer,
    targetDir,
    facts: {
      isNonHazardousComposite: true
    }
  });

  console.log('>>> [TEST] 流水线执行成功，返回结果:', {
    model: result.model,
    deliverablesCount: result.deliverables?.length,
    durationMs: result.durationMs
  });

  if (!result.success || result.deliverables?.length !== 8) {
    throw new Error(`交付物数量异常: 期望 8 项，实得 ${result.deliverables?.length} 项`);
  }

  // 2. 调用四维深度审计脚本验证
  console.log('>>> [TEST] 启动四维深度审计脚本进行端到端全维度核验...');
  const auditScriptPath = path.resolve(__dirname, '../scripts/run_four_dimensional_audit.mjs');
  const { stdout, stderr } = await execFileAsync('node', [auditScriptPath, targetDir, 'PA-3223']);
  console.log(stdout);
  if (stderr) console.error(stderr);

  console.log('>>> [TEST] 🎉 PA-3223 自适应通栏复合模态全流程测试与四维深度审计全绿通过 (Exit Code 0)！');
}

testPa3223FullPipeline().catch((err) => {
  console.error('>>> [TEST ERROR] 回归测试失败:', err);
  process.exit(1);
});
