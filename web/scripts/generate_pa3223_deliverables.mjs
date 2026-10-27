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
const userSourcePath = 'E:/冠志/TDS MSDS (2)/待处理文件/PA-3223/中文版本/PA-3223 msds_CN 冠志.docx';

async function generatePa3223FromUserSource() {
  console.log(`>>> [PIPELINE] 读取用户指定源文件: ${userSourcePath}`);
  const sourceBuffer = await fs.readFile(userSourcePath);

  // 1. 采用内存 Buffer 安全流转真实源文件数据，严禁在目标交付目录落盘非标准留存副本
  console.log(`>>> [PIPELINE] 真实源文件已由内存 Buffer 加载就绪 (${sourceBuffer.length} bytes)`);

  // 2. 执行受控流水线生成 8 格式标准交付物 (4 DOCX + 4 PDF，含 Gate 1~9 门禁)
  console.log(`>>> [PIPELINE] 启动标准 8 格式流水线生产...`);
  const result = await executeEightDeliverablesPipeline({
    modelCode: 'PA-3223',
    cnGroundTruthPath: userSourcePath,
    cnGroundTruthBuffer: sourceBuffer,
    targetDir,
    facts: {
      isNonHazardousComposite: true
    }
  });

  console.log('>>> [PIPELINE] 流水线执行成功，返回结果:', {
    model: result.model,
    deliverablesCount: result.deliverables?.length,
    durationMs: result.durationMs
  });

  if (!result.success || result.deliverables?.length !== 8) {
    throw new Error(`交付物数量异常: 期望 8 项，实得 ${result.deliverables?.length} 项`);
  }

  // 3. 运行四维深度审计进行端到端全维度核验
  console.log('>>> [AUDIT] 启动四维深度审计进行端到端全维度核验...');
  const auditScriptPath = path.resolve(__dirname, '../scripts/run_four_dimensional_audit.mjs');
  const { stdout, stderr } = await execFileAsync('node', [auditScriptPath, targetDir, 'PA-3223']);
  console.log(stdout);
  if (stderr) console.error(stderr);

  console.log('>>> [SUCCESS] 🎉 PA-3223 8 格式标准交付物全部成功生成并通过四维深度审计！');
}

generatePa3223FromUserSource().catch((err) => {
  console.error('>>> [ERROR] 流水线生成失败:', err);
  process.exit(1);
});
