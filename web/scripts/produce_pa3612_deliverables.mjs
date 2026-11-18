#!/usr/bin/env node

/**
 * PA-3612 标准 8 格式全矩阵成果生成脚本 (MSDS-Studio v8.0-ENTERPRISE)
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
  const modelCode = 'PA-3612';
  const sourcePath = path.resolve(
    REPO_ROOT,
    '算法训练材料/源文件材料/2-1 单组份水性丙烯酸乳液 PA/PA-3612/PA-3612 msds_CN 冠志.docx'
  );

  const targetDir = path.resolve(
    REPO_ROOT,
    '算法训练材料/TDS MSDS 重写版/02-1 单组份水性丙烯酸乳液 PA/PA-3612'
  );

  console.log(`============================================================`);
  console.log(`🚀 [MSDS-Studio] 启动 PA-3612 八格式标准交付物生产流程`);
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
      productName: '水性丙烯酸共聚物乳液',
      productNameEn: 'Aqueous acrylic copolymer emulsion',
      chemicalClassification: '改性丙烯酸乳液',
      chemicalClassificationEn: 'Modified acrylic emulsion',
      isHazardous: false,
      isDangerousGoods: false,
      signalWord: '',
      components: [
        { name: '丙烯酸树脂', cas: '商业机密', conc: '43-45%' },
        { name: '去离子水', cas: '7732-18-5', conc: '55-57%' }
      ],
      enComponents: [
        { name: 'Acrylic resin', cas: 'Trade secret', conc: '43-45%' },
        { name: 'Deionized water', cas: '7732-18-5', conc: '55-57%' }
      ],
      appearanceOverride: '微黄半透明液体',
      appearanceEn: 'Slightly yellowish translucent liquid',
      section9Overrides: {
        '外观': '微黄半透明液体',
        '气味': '无数据',
        '嗅觉阈值': '无数据',
        'PH值': '7-9 （1%水溶液）',
        'pH值': '7-9 （1%水溶液）',
        '离子性': '阴离子',
        '初沸点': '约100℃',
        '闪点': '不适用',
        '蒸发速率': '无数据',
        '可燃性': '不适用',
        '燃烧值': '不适用',
        '相对密度': '1.0-1.1 g/cm3',
        '密度': '1.0-1.1 g/cm3',
        '水溶性': '完全混溶',
        '表面张力': '无数据',
        '辛醇/水分配系数的对数值': '无数据',
        '自燃温度': '不适用',
        '引燃温度': '无数据',
        '动力粘度': '＜1000 mPa.s',
        '固体含量': '44±1%',
        '分解温度': '无数据',
        '爆炸特性': '无数据',
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

  console.log(`\n🎉 PA-3612 八格式标准交付物生产完成，退出码 0！`);
}

main().catch(err => {
  console.error('Fatal error in produce_pa3612_deliverables:', err);
  process.exit(1);
});
