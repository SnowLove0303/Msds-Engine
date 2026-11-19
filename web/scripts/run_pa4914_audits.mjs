import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '../..');

const { runBipolarBilayerAudit } = await import('./audit_bipolar_bilayer.mjs');
const { auditTranslationDualDisplay } = await import('./audit_translation_dual_display.mjs');

const modelCode = 'PA-4914';
const targetDir = path.resolve(
  REPO_ROOT,
  '算法训练材料/TDS MSDS 重写版/02-4 水溶性丙烯酸树脂 PA/PA-4914'
);

console.log(`🛡️ [AUDIT 1] 启动双极双层全景法医级深度主审计...`);
const auditRes = await runBipolarBilayerAudit(targetDir, modelCode);
console.log(`\n主审计结果: success=${auditRes.success}, failCount=${auditRes.failCount}`);
if (!auditRes.success) {
  console.error('主审计失败项:');
  auditRes.failures.forEach(f => console.error('  -', f));
  process.exit(1);
}

console.log(`\n🔍 [AUDIT 2] 启动中英双语 101 行逐句对照终审...`);
const transRes = await auditTranslationDualDisplay(
  path.join(targetDir, `${modelCode} msds_CN 冠志.docx`),
  path.join(targetDir, `${modelCode} msds_EN Guanzhi.docx`)
);
console.log(`\n对照终审结果: alarms=${transRes.alarms}`);
if (transRes.alarms > 0) {
  console.error('对照终审报警!');
  process.exit(1);
}

console.log(`\n🎉 [ALL PASSED] 双重终审 100% 满分通过，零缺陷！`);
