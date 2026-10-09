import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';

const dom = new JSDOM();
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const {
  loadDocx,
  extractHeaderFooterData,
  updateHeaderFooterData,
  buildExportDocxName,
} = await import('../src/docx-engine.js');

async function runTest() {
  console.log('[Test] 开始验证 docx-engine 页眉页脚与文件名管理...');

  const tplPath = path.resolve(__dirname, '../public/templates/正式模板_MSDS_CN_冠志(1).docx');
  const tplBuf = fs.readFileSync(tplPath);
  const engine = await loadDocx(tplBuf, '正式模板_MSDS_CN_冠志(1).docx');

  // 1. 验证模板提取
  const tplData = extractHeaderFooterData(engine);
  console.log('[Test] 模板页眉页脚提取结果:', JSON.stringify(tplData, null, 2));
  if (tplData.model !== 'PEA-4139' || !tplData.company.includes('冠志')) {
    throw new Error('模板初始元数据提取异常: ' + JSON.stringify(tplData));
  }

  // 2. 验证默认文件名
  const defaultName = buildExportDocxName(engine);
  console.log('[Test] 默认导出文件名:', defaultName);
  if (!defaultName.includes('PEA-4139') || !defaultName.includes('msds_CN')) {
    throw new Error('默认导出文件名不符合规范: ' + defaultName);
  }

  // 3. 验证更新页眉页脚为 OS-1030
  updateHeaderFooterData(engine, {
    model: 'OS-1030',
    revisionDate: '2026年10月08日',
    company: '广州冠志新材料科技有限公司',
    version: 'V1.0',
    title: '物料安全数据表',
  });

  const updatedData = extractHeaderFooterData(engine);
  console.log('[Test] 更新后元数据:', JSON.stringify(updatedData, null, 2));
  if (updatedData.model !== 'OS-1030' || updatedData.docCode !== 'OS-1030-MSDS') {
    throw new Error('更新后元数据未生效: ' + JSON.stringify(updatedData));
  }

  // 4. 验证更新后自动文件名
  const osName = buildExportDocxName(engine);
  console.log('[Test] OS-1030 规范文件名:', osName);
  if (osName !== 'OS-1030 msds_CN 冠志.docx') {
    throw new Error('OS-1030 规范文件名期望 "OS-1030 msds_CN 冠志.docx", 实际: ' + osName);
  }

  // 5. 验证自定义文件名
  const customName = buildExportDocxName(engine, { customFileName: 'OS-1030 msds_CN 冠志 (专供客户版)' });
  console.log('[Test] 自定义文件名:', customName);
  if (customName !== 'OS-1030 msds_CN 冠志 (专供客户版).docx') {
    throw new Error('自定义文件名未自动补全后缀或被覆盖: ' + customName);
  }

  // 6. 验证导出二进制
  const exported = await engine.exportArrayBuffer();
  if (!exported || exported.byteLength === 0) {
    throw new Error('导出 ArrayBuffer 为空');
  }

  console.log('✅ [Test Passed] docx-engine 页眉页脚与文件名管理单元测试全部通过！');
}

runTest().catch((err) => {
  console.error('❌ [Test Failed]', err);
  process.exit(1);
});
