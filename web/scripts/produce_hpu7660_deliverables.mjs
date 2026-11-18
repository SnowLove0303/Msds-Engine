#!/usr/bin/env node

/**
 * HPU-7660 标准 8 格式全矩阵成果生成脚本 (MSDS-Studio v8.0-ENTERPRISE)
 * 基于原生流水线 executeEightDeliverablesPipeline 驱动
 */

import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';

const dom = new JSDOM();
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '../..');

const { executeEightDeliverablesPipeline } = await import('../src/pipeline-engine.js');

async function main() {
  const modelCode = 'HPU-7660';
  const sourcePath = path.resolve(
    REPO_ROOT,
    '算法训练材料/源文件材料/1-2 水性羟基聚氨酯树脂 HPU/HPU-7660/HPU-7660 msds_CN 冠志.docx'
  );

  const targetDir = path.resolve(
    REPO_ROOT,
    '算法训练材料/TDS MSDS 重写版/01-2 水性羟基聚氨酯树脂 HPU/HPU-7660'
  );

  console.log(`============================================================`);
  console.log(`🚀 [MSDS-Studio] 启动 HPU-7660 八格式标准交付物生产流程`);
  console.log(`   • 产品型号: ${modelCode}`);
  console.log(`   • 源文件路径: ${sourcePath}`);
  console.log(`   • 交付目录: ${targetDir}`);
  console.log(`============================================================\n`);

  if (!fsSync.existsSync(sourcePath)) {
    console.error(`❌ 源文件不存在: ${sourcePath}`);
    process.exit(1);
  }

  await fs.mkdir(targetDir, { recursive: true });
  const sourceBuffer = await fs.readFile(sourcePath);

  const result = await executeEightDeliverablesPipeline({
    modelCode,
    cnGroundTruthPath: sourcePath,
    cnGroundTruthBuffer: sourceBuffer,
    targetDir,
    facts: {
      modelCode,
      productName: '羟基聚氨酯分散体',
      productNameEn: 'Hydroxy polyurethane dispersion',
      isHazardous: false,
      isDangerousGoods: false,
      signalWord: '',
      components: [
        { name: '聚氨酯聚合物', cas: 'Trade secret', conc: '＞35%' },
        { name: '水', cas: '7732-18-5', conc: '＞60%' },
        { name: 'N,N-二甲基乙醇胺', cas: '108-01-0', conc: '1-5%' }
      ],
      enComponents: [
        { name: 'Polyurethane polymer', cas: 'Trade secret', conc: '＞35%' },
        { name: 'Water', cas: '7732-18-5', conc: '＞60%' },
        { name: '2-Dimethylaminoethanol', cas: '108-01-0', conc: '1-5%' }
      ],
      appearanceOverride: '透明至半透明液体',
      appearanceEn: 'Transparent to translucent liquid',
      section9Overrides: {
        '外观': '透明至半透明液体',
        '气味': '无数据',
        'PH值': '7-9 （按1:10的比例用水稀释）',
        'pH值': '7-9 （按1:10的比例用水稀释）',
        '初沸点': '约100℃',
        '闪点': '初沸点以下无闪点',
        '相对密度': '约1.06 g/cm3',
        '水溶性': '可混溶',
        '动力粘度': '＜1000 mPa.s',
        '固体含量': '37±2%',
        '自燃温度': '不适用',
        '引燃温度': '约420℃',
        '分解温度': '无数据',
        '爆炸特性': '无数据',
        '可燃性': '不适用',
        '粉尘爆炸级别': '不适用',
        '其他信息': '上述数据非产品指标，产品指标请参见产品技术信息表。'
      }
    }
  });

  console.log('\n>>> [PIPELINE] 流水线底层生产完成:', {
    model: result.model,
    deliverablesCount: result.deliverables?.length,
    durationMs: result.durationMs
  });

  console.log(`\n🎉 HPU-7660 八格式标准交付物生产完成，退出码 0！`);
}

main().catch(err => {
  console.error('Fatal error in produce_hpu7660_deliverables:', err);
  process.exit(1);
});
