import { runBipolarBilayerAudit } from './audit_bipolar_bilayer.mjs';

async function main() {
  const res = await runBipolarBilayerAudit('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/PA-3223', 'PA-3223');
  console.log('\n>>> FAILURES COUNT:', res.failCount);
  res.failureDetails.forEach((f, i) => {
    console.log(`[${i+1}]`, JSON.stringify(f));
  });
}

main().catch(console.error);
