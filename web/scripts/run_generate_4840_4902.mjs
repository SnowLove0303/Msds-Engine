import { executeEightDeliverablesPipeline } from '../src/pipeline-engine.js';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html><body></body></html>');
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

const PA4840_SRC = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料/2-4 水溶性丙烯酸树脂 PA/PA-4840/PA-4840 msds_CN 冠志_源文件留存.docx';
const PA4840_TARGET = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/02-4 水溶性丙烯酸树脂 PA/PA-4840';

const PA4902_SRC = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料/2-1 单组份水性丙烯酸乳液 PA/PA-4902/PA-4902msds_CN 冠志___源文件留存.docx';
const PA4902_TARGET = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/02-1 单组份水性丙烯酸乳液 PA/PA-4902';

async function main() {
  console.log('=== GENERATING PA-4840 DELIVERABLES ===');
  const res4840 = await executeEightDeliverablesPipeline({
    modelCode: 'PA-4840',
    cnGroundTruthPath: PA4840_SRC,
    targetDir: PA4840_TARGET
  });
  const files4840 = res4840.deliverables || [];
  console.log('PA-4840 Output count:', files4840.length);
  for (const r of files4840) {
    console.log(`  - [${r.format}] ${r.name} (${r.size} bytes)`);
  }

  console.log('\n=== GENERATING PA-4902 DELIVERABLES ===');
  const res4902 = await executeEightDeliverablesPipeline({
    modelCode: 'PA-4902',
    cnGroundTruthPath: PA4902_SRC,
    targetDir: PA4902_TARGET
  });
  const files4902 = res4902.deliverables || [];
  console.log('PA-4902 Output count:', files4902.length);
  for (const r of files4902) {
    console.log(`  - [${r.format}] ${r.name} (${r.size} bytes)`);
  }
}

main().catch(err => {
  console.error('FATAL ERROR:', err);
  process.exit(1);
});
