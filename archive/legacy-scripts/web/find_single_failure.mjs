import { runBipolarBilayerAudit } from './scripts/audit_bipolar_bilayer.mjs';

async function main() {
  const targetDir = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/01-1 单组份水性聚氨酯树脂 PU/PU-218A';
  // Capture console.error or inspect
  const origError = console.error;
  const errorLogs = [];
  console.error = (...args) => {
    errorLogs.push(args.join(' '));
    origError(...args);
  };
  const res = await runBipolarBilayerAudit(targetDir, 'PU-218A');
  console.log('\n================================');
  console.log('Intercepted error logs:');
  errorLogs.forEach(l => console.log('LOG:', l));
  console.log('Result object keys:', Object.keys(res));
  console.log('Fail count:', res.failCount);
}

main().catch(console.error);
