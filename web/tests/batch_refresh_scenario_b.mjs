import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '../..');
const PIPELINE_SCRIPT = path.resolve(REPO_ROOT, 'web/scripts/run_universal_msds_pipeline.mjs');
const TARGET_BASE = path.resolve(REPO_ROOT, '算法训练材料/TDS MSDS 重写版');

/**
 * 22 款产品清单 (涵盖 4 大品类)
 */
export const SCENARIO_B_MODELS = [
  // 品类 1: 01-1 单组份水性聚氨酯树脂 PU (1款)
  { cat: '01-1 单组份水性聚氨酯树脂 PU', name: 'PU-6013Bio' },

  // 品类 2: 01-2 水性羟基聚氨酯树脂 HPU (2款)
  { cat: '01-2 水性羟基聚氨酯树脂 HPU', name: 'HPU-7660' },
  { cat: '01-2 水性羟基聚氨酯树脂 HPU', name: 'HPU-7700' },

  // 品类 3: 02-1 单组份水性丙烯酸乳液 PA (6款)
  { cat: '02-1 单组份水性丙烯酸乳液 PA', name: 'PA-3612' },
  { cat: '02-1 单组份水性丙烯酸乳液 PA', name: 'PA-3615' },
  { cat: '02-1 单组份水性丙烯酸乳液 PA', name: 'PA-3617' },
  { cat: '02-1 单组份水性丙烯酸乳液 PA', name: 'PA-3655' },
  { cat: '02-1 单组份水性丙烯酸乳液 PA', name: 'PA-3656' },
  { cat: '02-1 单组份水性丙烯酸乳液 PA', name: 'PA-3663' },

  // 品类 4: 02-2 水性羟基丙烯酸乳液 PA (13款)
  { cat: '02-2 水性羟基丙烯酸乳液 PA', name: 'PA-4000' },
  { cat: '02-2 水性羟基丙烯酸乳液 PA', name: 'PA-4006' },
  { cat: '02-2 水性羟基丙烯酸乳液 PA', name: 'PA-4771' },
  { cat: '02-2 水性羟基丙烯酸乳液 PA', name: 'PA-4778' },
  { cat: '02-2 水性羟基丙烯酸乳液 PA', name: 'PA-4800' },
  { cat: '02-2 水性羟基丙烯酸乳液 PA', name: 'PA-4804T' },
  { cat: '02-2 水性羟基丙烯酸乳液 PA', name: 'PA-4807' },
  { cat: '02-2 水性羟基丙烯酸乳液 PA', name: 'PA-4808' },
  { cat: '02-2 水性羟基丙烯酸乳液 PA', name: 'PA-4812' },
  { cat: '02-2 水性羟基丙烯酸乳液 PA', name: 'PA-4816' },
  { cat: '02-2 水性羟基丙烯酸乳液 PA', name: 'PA-4817' },
  { cat: '02-2 水性羟基丙烯酸乳液 PA', name: 'PA-4819' },
  { cat: '02-2 水性羟基丙烯酸乳液 PA', name: 'PA-4835' }
];

function findSourceDocx(targetDir, modelName) {
  if (!fs.existsSync(targetDir)) return null;
  const files = fs.readdirSync(targetDir);
  // 优先匹配基准中文版 *msds_CN 冠志.docx
  const cnGuanzhi = files.find(f => /msds.*CN.*冠志.*\.docx$/i.test(f) && !f.includes('~$'));
  if (cnGuanzhi) return path.join(targetDir, cnGuanzhi);
  // 其次匹配任意中文 docx
  const anyCn = files.find(f => /CN.*\.docx$/i.test(f) && !f.includes('~$'));
  if (anyCn) return path.join(targetDir, anyCn);
  return null;
}

export function runModelRefresh(modelInfo, index, total) {
  const targetDir = path.join(TARGET_BASE, modelInfo.cat, modelInfo.name);
  const sourceDocx = findSourceDocx(targetDir, modelInfo.name);

  if (!sourceDocx) {
    throw new Error(`[ERROR] 找不到型号 ${modelInfo.name} 的基准中文 Word 源文件于: ${targetDir}`);
  }

  console.log(`\n========================================================================`);
  console.log(`[${index + 1}/${total}] 推进刷新型号: ${modelInfo.name} (${modelInfo.cat})`);
  console.log(`  • 源文件: ${sourceDocx}`);
  console.log(`  • 目标目录: ${targetDir}`);
  console.log(`========================================================================`);

  const cmd = `node "${PIPELINE_SCRIPT}" --source="${sourceDocx}" --targetDir="${targetDir}"`;
  const tStart = Date.now();
  try {
    const stdout = execSync(cmd, { cwd: REPO_ROOT, encoding: 'utf8', stdio: 'inherit' });
    const elapsed = ((Date.now() - tStart) / 1000).toFixed(1);
    console.log(`✅ [${index + 1}/${total}] 型号 ${modelInfo.name} 刷新完成 (耗时: ${elapsed}s)`);
    return { success: true, model: modelInfo.name, elapsed };
  } catch (err) {
    console.error(`❌ [${index + 1}/${total}] 型号 ${modelInfo.name} 刷新失败:`, err.message);
    return { success: false, model: modelInfo.name, error: err.message };
  }
}

async function main() {
  const args = process.argv.slice(2);
  let filterModel = null;
  let filterCat = null;

  for (const arg of args) {
    if (arg.startsWith('--model=')) filterModel = arg.split('=', 2)[1];
    if (arg.startsWith('--cat=')) filterCat = arg.split('=', 2)[1];
  }

  let list = SCENARIO_B_MODELS;
  if (filterModel) {
    list = list.filter(m => m.name.toLowerCase() === filterModel.toLowerCase());
  } else if (filterCat) {
    list = list.filter(m => m.cat.includes(filterCat));
  }

  console.log(`========================================================================`);
  console.log(`      场景B 22款产品标准化批量刷新调度中枢 (Target Count: ${list.length})       `);
  console.log(`========================================================================`);

  const results = [];
  const tOverallStart = Date.now();

  for (let i = 0; i < list.length; i++) {
    const res = runModelRefresh(list[i], i, list.length);
    results.push(res);
    if (!res.success) {
      console.error(`[FATAL] 批量推进中断于型号 ${list[i].name}，立即停止防脏状态堆叠！`);
      process.exit(1);
    }
  }

  const totalElapsed = ((Date.now() - tOverallStart) / 1000).toFixed(1);
  console.log(`\n========================================================================`);
  console.log(`🎉 场景B 批量刷新全部执行完毕！`);
  console.log(`  • 成功处理型号数: ${results.filter(r => r.success).length} / ${list.length}`);
  console.log(`  • 总耗时: ${totalElapsed}s`);
  console.log(`========================================================================\n`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch(err => {
    console.error('Fatal error in batch_refresh_scenario_b:', err);
    process.exit(1);
  });
}
