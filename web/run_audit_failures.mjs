import { runBipolarBilayerAudit } from './scripts/audit_bipolar_bilayer.mjs';

async function main() {
  const targetDir = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/01-1 单组份水性聚氨酯树脂 PU/PU-218A';
  const res = await runBipolarBilayerAudit(targetDir, 'PU-218A');
  console.log('=== ALL FAILURES ===');
  res.failures.forEach((f, i) => console.log(`${i + 1}: [${f.gate || f.rule || 'AUDIT'}] ${f.message}`));
}

main().catch(console.error);
