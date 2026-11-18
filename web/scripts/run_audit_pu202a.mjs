import { runBipolarBilayerAudit } from './audit_bipolar_bilayer.mjs';

const targetDir = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/PU-202A';
const res = await runBipolarBilayerAudit(targetDir, 'PU-202A');
console.log('\nAudit Final Return:', res);
process.exit(res?.success ? 0 : 1);
