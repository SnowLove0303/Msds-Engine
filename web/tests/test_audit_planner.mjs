import { planAuditTargets, verifyAuditContract } from '../src/audit-planner.js';

async function runTest() {
  console.log('=== Testing Audit Planner ===');

  const model = 'PU-218A';
  const mockFacts = {
    modelCode: model,
    ghs: {
      isHazardous: true,
      signalWord: '危险',
      categories: ['急性毒性4', '皮肤腐蚀3']
    },
    toxicology: {
      paradigm: 'PARADIGM_2_STANDARD_SLOTS'
    }
  };

  // 1. 生成前置审计目标契约
  const contract = planAuditTargets(model, mockFacts);
  console.log('Audit contract planned for:', contract.modelCode);
  console.log('Expected files:', contract.targets.global.expectedFiles.length);
  console.log('Section 2 full-width expected:', contract.targets.section2.isFullWidth);
  console.log('Section 9 expected rows:', contract.targets.section9.expectedRowsCount);
  console.log('Section 11 expected rows:', contract.targets.section11.expectedRowsCount);

  if (contract.targets.global.expectedFiles.length !== 8) {
    throw new Error('Expected 8 files in contract');
  }

  // 2. 校验已生成的真实交付目录
  const targetDir = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/01-1 单组份水性聚氨酯树脂 PU/PU-218A';
  const verifyRes = await verifyAuditContract(targetDir, contract);

  console.log('Verification passes:', verifyRes.passes.length);
  console.log('Verification failures:', verifyRes.failCount);

  if (!verifyRes.success) {
    console.error('Failures:', verifyRes.failures);
    throw new Error('Audit contract verification failed');
  }

  console.log('🎉 Audit Planner Test PASSED (Exit Code 0)');
}

runTest().catch(err => {
  console.error('❌ Test FAILED:', err);
  process.exit(1);
});
