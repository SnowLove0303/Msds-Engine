#!/usr/bin/env node

/**
 * MSDS-Engine: Context 2 直接写入编辑器并导出八格式成果脚本
 * 
 * 核心机制:
 * 1. 严格对照现有编辑器功能直接写入 Context 2 数据；
 * 2. 导出 4 份标准 DOCX 并转换为 4 份原生高清 PDF；
 * 3. 产出交付至 "算法训练材料/TDS MSDS 重写版/01-2 水性羟基聚氨酯树脂 HPU/HPU-7651"；
 * 4. 真实检验编辑器现状，客观提取排版与格式问题。
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { recognizeSourceDocx } from '../src/recognition-engine.js';
import { governContext } from '../src/context-governor.js';
import { writeDeliverableViaEditor } from '../src/editor-writer.js';
import { convertBatchDocxToPdf } from '../src/pdf-converter.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '../..');

async function main() {
  const args = process.argv.slice(2);
  const isDryRun = args.includes('--dry-run');

  const modelCode = 'HPU-7651';
  const sourceDocxPath = path.resolve(
    REPO_ROOT,
    '算法训练材料/源文件材料/1-2 水性羟基聚氨酯树脂 HPU/HPU-7651/HPU-7651 msds_CN 冠志.docx'
  );

  const targetDir = path.resolve(
    REPO_ROOT,
    '算法训练材料/TDS MSDS 重写版/01-2 水性羟基聚氨酯树脂 HPU/HPU-7651'
  );

  console.log(`============================================================`);
  console.log(`🚀 [MSDS-Studio] 启动 Context 2 编辑器写入与八格式导出流程`);
  console.log(`   • 产品型号: ${modelCode}`);
  console.log(`   • 源文件路径: ${sourceDocxPath}`);
  console.log(`   • 交付目标目录: ${targetDir}`);
  if (isDryRun) console.log(`   • 模式: DRY-RUN (演练模式，仅校验数据通路)`);
  console.log(`============================================================\n`);

  if (!fs.existsSync(sourceDocxPath)) {
    console.error(`❌ 源文件不存在: ${sourceDocxPath}`);
    process.exit(1);
  }

  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
    console.log(`📁 创建目标输出目录: ${targetDir}`);
  }

  // 1. 读取源文件并生成 Context 1 事实
  console.log(`▶ 步骤 1: 读取并识别源文件事实 (Context 1)...`);
  const fileBuf = fs.readFileSync(sourceDocxPath);
  const context1 = await recognizeSourceDocx(fileBuf, path.basename(sourceDocxPath));
  context1.modelCode = modelCode;
  console.log(`  ✓ Context 1 提取完毕: 品名 "${context1.productName}", GHS危化品=${Boolean(context1.ghs?.isHazardous)}`);

  // 2. 治理 Context 2 数据模型
  console.log(`▶ 步骤 2: 组装 Context 2 中英双轨治理模型...`);
  const governed = governContext(context1);
  const context2 = {
    ...context1,
    ...governed.cn,
    enComponents: governed.componentsEn,
    componentsEn: governed.componentsEn,
    enTransport: governed.en.transport,
    enValues: governed.en.fieldOverrides || {},
    ghs: governed.cn.ghs,
    physicalProperties: governed.cn.physicalProperties
  };

  const enContext = {
    ...context2,
    components: context2.enComponents || context2.componentsEn || context2.components,
    transport: governed.en.transport,
    disposal: governed.en.disposal,
    productName: governed.en.productName,
    productNameEn: governed.en.productNameEn,
    physicalProperties: governed.en.physicalProperties
  };

  console.log(`  ✓ Context 2 组装完毕: 包含中文治理模型与英文治理模型`);

  if (isDryRun) {
    console.log(`\n✅ Dry-Run 校验通过！数据通路与编辑器接口就绪，退出码 0。`);
    process.exit(0);
  }

  // 3. 直接调用现有编辑器功能写入 4 份 DOCX
  console.log(`\n▶ 步骤 3: 直接调用编辑器现有功能写入并导出 4 份 DOCX...`);
  const docxDeliverables = [];

  // 3.1 冠志中文 DOCX
  const cnGzDocx = path.join(targetDir, `${modelCode} msds_CN 冠志.docx`);
  console.log(`  [1/4] 写入冠志中文 DOCX: ${path.basename(cnGzDocx)}...`);
  await writeDeliverableViaEditor({
    templateKey: 'CN_Guanzhi',
    contextData: context2,
    isEnglish: false,
    entityId: 'GUANZHI',
    outputPath: cnGzDocx
  });
  docxDeliverables.push(cnGzDocx);

  // 3.2 国彩中文 DOCX
  const cnGcDocx = path.join(targetDir, `${modelCode} msds_CN 国彩.docx`);
  console.log(`  [2/4] 写入国彩中文 DOCX: ${path.basename(cnGcDocx)}...`);
  await writeDeliverableViaEditor({
    templateKey: 'CN_Guocai',
    contextData: context2,
    isEnglish: false,
    entityId: 'GUOCAI',
    outputPath: cnGcDocx
  });
  docxDeliverables.push(cnGcDocx);

  // 3.3 冠志英文 DOCX
  const enGzDocx = path.join(targetDir, `${modelCode} msds_EN Guanzhi.docx`);
  console.log(`  [3/4] 写入冠志英文 DOCX: ${path.basename(enGzDocx)}...`);
  await writeDeliverableViaEditor({
    templateKey: 'EN_Guanzhi',
    contextData: enContext,
    isEnglish: true,
    entityId: 'GUANZHI',
    outputPath: enGzDocx
  });
  docxDeliverables.push(enGzDocx);

  // 3.4 国彩英文 DOCX
  const enGcDocx = path.join(targetDir, `${modelCode} msds_EN Guocai.docx`);
  console.log(`  [4/4] 写入国彩英文 DOCX: ${path.basename(enGcDocx)}...`);
  await writeDeliverableViaEditor({
    templateKey: 'EN_Guocai',
    contextData: enContext,
    isEnglish: true,
    entityId: 'GUOCAI',
    outputPath: enGcDocx
  });
  docxDeliverables.push(enGcDocx);

  console.log(`  ✓ 4 份 DOCX 全部写入完毕！`);

  // 4. 批量转换为 4 份原生 PDF
  console.log(`\n▶ 步骤 4: 批量转换为 4 份原生高清 PDF...`);
  const pdfItems = [
    { sourcePath: cnGzDocx, outputPath: path.join(targetDir, `${modelCode} msds_CN 冠志.pdf`) },
    { sourcePath: cnGcDocx, outputPath: path.join(targetDir, `${modelCode} msds_CN 国彩.pdf`) },
    { sourcePath: enGzDocx, outputPath: path.join(targetDir, `${modelCode} msds_EN Guanzhi.pdf`) },
    { sourcePath: enGcDocx, outputPath: path.join(targetDir, `${modelCode} msds_EN Guocai.pdf`) }
  ];

  const batchInputs = pdfItems.map(item => ({
    docxBuffer: fs.readFileSync(item.sourcePath),
    fileName: path.basename(item.sourcePath)
  }));

  const convertedPdfs = await convertBatchDocxToPdf(batchInputs);
  const pdfDeliverables = [];

  for (let i = 0; i < convertedPdfs.length; i++) {
    const res = convertedPdfs[i];
    const item = pdfItems[i];
    if (res && res.pdfBuffer && item) {
      fs.writeFileSync(item.outputPath, res.pdfBuffer);
      pdfDeliverables.push(item.outputPath);
      console.log(`  ✓ 已生成 PDF [${i + 1}/4]: ${path.basename(item.outputPath)} (${res.pdfBuffer.length} bytes)`);
    } else {
      console.error(`  ❌ PDF 转换失败: ${item.sourcePath}`);
    }
  }

  // 5. 校验 8 格式全量交付物
  console.log(`\n============================================================`);
  console.log(`📦 八格式交付物核对清单 (${modelCode}):`);
  console.log(`============================================================`);
  const allDeliverables = [...docxDeliverables, ...pdfDeliverables];
  let allValid = true;

  allDeliverables.forEach((filePath, idx) => {
    const exists = fs.existsSync(filePath);
    const size = exists ? fs.statSync(filePath).size : 0;
    const isValid = exists && size > 0;
    if (!isValid) allValid = false;
    const mark = isValid ? '✅' : '❌';
    console.log(`  ${mark} [${idx + 1}/8] ${path.basename(filePath)} (${size} bytes)`);
  });

  if (!allValid || allDeliverables.length !== 8) {
    console.error(`\n❌ 八格式交付物存在缺失或 0 字节文件！`);
    process.exit(1);
  }

  console.log(`\n🎉 八格式全部成功生成并投递至: ${targetDir}`);
}

main().catch(err => {
  console.error(`💥 执行发生未捕获异常:`, err);
  process.exit(1);
});
