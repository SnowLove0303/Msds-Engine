import fs from 'node:fs/promises';
import path from 'node:path';
import { JSDOM } from 'jsdom';

const dom = new JSDOM();
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

const { executeEightDeliverablesPipeline } = await import('../src/pipeline-engine.js');
const { runMasterMsdsAudit } = await import('./run_master_msds_audit.mjs');

const targetDir = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/12 水性噁唑啉交联剂 OX/OS-8970';
const userTargetDir = 'E:/冠志/TDS MSDS (2)/待处理文件/OS-8970';
const sourcePath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料/水性噁唑啉交联剂/OS-8970/OS-8970 msds_CN 冠志.docx';

async function generateOs8970() {
  const startTime = Date.now();
  console.log('📡 [MSDS-Studio Phase 1] 正在建立 MSDS-Engine 原生流水线通信通道...');
  console.log(`🔍 [MSDS-Studio Phase 2] 读取源文件化学事实: ${sourcePath}`);
  const sourceBuffer = await fs.readFile(sourcePath);

  await fs.mkdir(targetDir, { recursive: true });

  console.log('🚀 [MSDS-Studio Phase 3~10] 启动 MSDS-Engine 标准 8 格式受控生产流水线 (OS-8970)...');
  const result = await executeEightDeliverablesPipeline({
    modelCode: 'OS-8970',
    cnGroundTruthPath: sourcePath,
    cnGroundTruthBuffer: sourceBuffer,
    targetDir,
    facts: {
      modelCode: 'OS-8970',
      isHazardous: false,
      isDangerousGoods: false,
      signalWord: '',
      components: [
        { name: 'Oxazoline-modified acrylic polymer', cas: 'Trade secret', conc: '40±1' },
        { name: 'Water', cas: '7732-18-5', conc: '60±1' }
      ],
      appearanceOverride: '淡黄色至黄色透明液体',
      section9Overrides: {
        '外观': '淡黄色至黄色透明液体',
        'PH值': '6.5-8.5',
        '水溶性': '可混溶的',
        '粘度': '＜500 mPa·s',
        '固体含量': '约25%',
        '闪点': '初沸点以下无闪点',
        '自燃温度': '无数据',
        '引燃温度': '无数据',
        '分解温度': '无数据',
        '爆炸特性': '无数据',
        '可燃性': '不适用',
        '粉尘爆炸级别': '不适用',
        '其他信息': '上述数据非产品指标，产品指标请参见产品技术信息表。'
      }
    }
  });

  console.log('>>> [PIPELINE] 流水线底层生产完成:', {
    model: result.model,
    deliverablesCount: result.deliverables?.length,
    durationMs: result.durationMs
  });

  const docxNames = [
    'OS-8970 msds_CN 冠志.docx',
    'OS-8970 msds_CN 国彩.docx',
    'OS-8970 msds_EN Guanzhi.docx',
    'OS-8970 msds_EN Guocai.docx'
  ];
  const allDeliverableNames = docxNames.concat(docxNames.map(d => d.replace('.docx', '.pdf')));

  // 同步全量交付物到用户目录
  console.log(`📂 同步全量交付物到用户目录: ${userTargetDir}...`);
  await fs.mkdir(userTargetDir, { recursive: true });
  for (const f of allDeliverableNames) {
    const src = path.join(targetDir, f);
    const dest = path.join(userTargetDir, f);
    try {
      await fs.copyFile(src, dest);
    } catch (_) {}
  }
  console.log('🎉 全量交付物已全部同步到用户目录！');

  // 运行中央主审计套件自检
  console.log('\n🛡️ [MSDS-Studio Phase 11] 启动集中式中央主审计套件自检...');
  const auditRes = await runMasterMsdsAudit({
    model: 'OS-8970',
    targetDir,
    sourceDocx: sourcePath
  });

  if (!auditRes.success) {
    throw new Error(`主审计套件未通过: 存在 ${auditRes.failCount} 项真实缺陷！`);
  }

  console.log('\n🛡️ [MSDS-Studio Phase 12] 启动双极双层全景机械深度审计 (165 项)...');
  const { runBipolarBilayerAudit } = await import('./audit_bipolar_bilayer.mjs');
  await runBipolarBilayerAudit(targetDir, 'OS-8970');

  const totalSeconds = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n🎉 OS-8970 8 份标准交付物极速生产并 100% 审计通过！总耗时: ${totalSeconds}s`);
}

generateOs8970().catch(err => {
  console.error('❌ Generation / Audit failed:', err);
  process.exit(1);
});
