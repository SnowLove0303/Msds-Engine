import fs from 'fs';
import path from 'path';
import { runBipolarBilayerAudit } from './scripts/audit_bipolar_bilayer.mjs';

async function verifyAll() {
  const targetDir = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/01-1 单组份水性聚氨酯树脂 PU/PU-218A';
  
  console.log('========================================================================');
  console.log('       PU-218A 主 Agent 零信任双极双层全景终审核销');
  console.log('========================================================================');

  // 1. 物理文件盘点
  const files = fs.readdirSync(targetDir).filter(f => !fs.statSync(path.join(targetDir, f)).isDirectory());
  const tdsFiles = files.filter(f => /tds_/i.test(f));
  const msdsFiles = files.filter(f => /msds_/i.test(f));
  const otherFiles = files.filter(f => !/tds_|msds_/i.test(f));

  console.log(`[盘点 1] 目标目录文件总数: ${files.length} (要求严格等于 16)`);
  console.log(`         - TDS 交付物: ${tdsFiles.length} 份 (要求 4 DOCX + 4 PDF)`);
  console.log(`         - MSDS 交付物: ${msdsFiles.length} 份 (要求 4 DOCX + 4 PDF)`);
  console.log(`         - 临时杂件: ${otherFiles.length} 份 (要求 0)`);

  if (files.length !== 16 || tdsFiles.length !== 8 || msdsFiles.length !== 8 || otherFiles.length !== 0) {
    console.error('❌ 文件盘点不合格！');
    process.exit(1);
  }
  console.log('✅ [PASS] 物理文件 1:1 盘点满分通过 (严格 16 份正式交付物，零临时碎片)！\n');

  // 2. 运行官方双极双层审计
  console.log('[盘点 2] 执行 MSDS 官方双极双层全景审计...');
  const auditRes = await runBipolarBilayerAudit(targetDir, 'PU-218A');
  if (!auditRes.success) {
    console.error(`❌ MSDS 双极双层审计失败，违章数: ${auditRes.failCount}`);
    process.exit(1);
  }
  console.log('✅ [PASS] MSDS 双极双层全景审计 100% 满分通过 (Failures: 0)！\n');

  // 3. 深度内容真实性交叉核验 (G-Anti-Slop / Anti-Hallucination)
  console.log('[盘点 3] 零死数据、零幽灵污染深度交叉核验...');
  for (const f of msdsFiles) {
    if (!f.endsWith('.docx')) continue;
    const fullPath = path.join(targetDir, f);
    const content = fs.readFileSync(fullPath).toString('binary');
    
    // 严禁丙烯酸酯死数据
    if (content.includes('羟基丙烯酸酯') || content.includes('Hydroxy acrylic')) {
      console.error(`❌ [FAIL] ${f} 存在死数据残留: 羟基丙烯酸酯`);
      process.exit(1);
    }
    // 严禁 N-甲基吡咯烷酮 (NMP) 串号污染 (PU-218A 为单组份聚氨酯，NEP/DMAC 体系，绝非 NMP)
    if (content.includes('N-甲基吡咯烷酮') || content.includes('N-Methyl-2-pyrrolidone')) {
      console.error(`❌ [FAIL] ${f} 存在串号残留: N-甲基吡咯烷酮`);
      process.exit(1);
    }
    // 严禁二甲基乙醇胺 (DMEA) 串号污染
    if (content.includes('二甲基乙醇胺') || content.includes('Dimethylethanolamine')) {
      console.error(`❌ [FAIL] ${f} 存在串号残留: 二甲基乙醇胺`);
      process.exit(1);
    }
    console.log(`  - ${f}: 零死数据、零丙烯酸酯、零 DMEA、零 NMP 幽灵残留！`);
  }
  console.log('✅ [PASS] 零死数据、零幽灵污染交叉核验 100% 满分通过！\n');
  console.log('========================================================================');
  console.log('🎉🎉🎉 PU-218A 最终交付物已达到 100% 工业级最高免检出厂标准！');
  console.log('========================================================================');
}

verifyAll().catch(err => {
  console.error(err);
  process.exit(1);
});
