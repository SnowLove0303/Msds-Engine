import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { recognizeSourceDocx } from '../src/msds-source-semantic-adapter.js';
import { governContext } from '../src/context-governor.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '../..');

async function run() {
  const sourcePath = path.resolve(REPO_ROOT, '算法训练材料/源文件材料/1-2 水性羟基聚氨酯树脂 HPU/HPU-7660/HPU-7660 msds_CN 冠志.docx');
  const buf = fs.readFileSync(sourcePath);
  const context1 = await recognizeSourceDocx(buf, path.basename(sourcePath));
  context1.modelCode = 'HPU-7660';
  
  const governed = governContext(context1);
  
  console.log('=== HPU-7660 CONTEXT 1 RECOGNITION SUMMARY ===');
  console.log('Product Name:', context1.productName);
  console.log('Model Code:', context1.modelCode);
  console.log('GHS Hazardous:', context1.ghs?.isHazardous);
  console.log('Components (CN):', JSON.stringify(context1.components, null, 2));
  console.log('Components (EN):', JSON.stringify(governed.componentsEn, null, 2));
  console.log('Physical Properties (CN):', JSON.stringify(governed.cn.physicalProperties, null, 2));
  console.log('Physical Properties (EN):', JSON.stringify(governed.en.physicalProperties, null, 2));
  console.log('Section 2 GHS Categories:', JSON.stringify(context1.ghs?.categories, null, 2));
  console.log('Section 14 Transport (CN):', JSON.stringify(governed.cn.transport, null, 2));
  console.log('Section 14 Transport (EN):', JSON.stringify(governed.en.transport, null, 2));
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
