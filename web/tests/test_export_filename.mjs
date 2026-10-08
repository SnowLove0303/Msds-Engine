import fs from 'node:fs';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { JSDOM } from '../node_modules/jsdom/lib/api.js';

const dom = new JSDOM('<!doctype html><html><body></body></html>');
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

import {
  loadDocx,
  buildExportDocxName,
  extractModelFromText,
} from '../src/docx-engine.js';

console.log('=== MSDS-Engine 导出 DOCX 文件命名规范自动化测试 ===\n');

// 1. extractModelFromText 单元测试
console.log('--- 测试用例 1: extractModelFromText 字符串提取 ---');
assert.equal(extractModelFromText('OS-1030 原件.pdf'), 'OS-1030');
assert.equal(extractModelFromText('PU-1001_source_converted.docx'), 'PU-1001');
assert.equal(extractModelFromText('BEK-500L msds_EN 冠志.docx'), 'BEK-500L');
assert.equal(extractModelFromText('PU-2186E msds_CN 国彩.docx'), 'PU-2186E');
assert.equal(extractModelFromText('AMP-95 msds-CN-冠志.docx'), 'AMP-95');
console.log('✓ extractModelFromText 各类型号提取验证通过！\n');

// 2. 真实 OS-1030 文件导出命名
console.log('--- 测试用例 2: 真实 OS-1030 结构导出命名 ---');
const osBuf = fs.readFileSync('E:/冠志/TDS MSDS (2)/TDS MSDS/产品 TDS MSDS -- WORD版本/7 水性助剂 OS等/OS-1030 msds_CN 冠志.docx');
const engineOs = await loadDocx(osBuf, 'OS-1030 msds_CN 冠志.docx');
const osName = buildExportDocxName(engineOs, { templateName: 'CN 冠志' });
console.log(`生成文件名: ${osName}`);
assert.equal(osName, 'OS-1030 msds_CN 冠志.docx');
console.log('✓ OS-1030 完美契合 "OS-1030 msds_CN 冠志.docx" 规范！\n');

// 3. 智能匹配文件 PU-1001 导出命名
console.log('--- 测试用例 3: 智能匹配后 PU-1001 结构导出命名 ---');
const p1Path = fileURLToPath(new URL('../../scratch/standard-compare/PU-1001_current_matching_CN_冠志.docx', import.meta.url));
const p1Buf = fs.readFileSync(p1Path);
const engineP1 = await loadDocx(p1Buf, 'PU-1001_current_matching_CN_冠志.docx');
const p1Name = buildExportDocxName(engineP1, { templateName: 'CN 冠志' });
console.log(`生成文件名: ${p1Name}`);
assert.equal(p1Name, 'PU-1001 msds_CN 冠志.docx');
console.log('✓ PU-1001 成功从 Section 1 中文名称中识别型号并导出 "PU-1001 msds_CN 冠志.docx"！\n');

// 4. 英文模板 + 源文件名称挂载
console.log('--- 测试用例 4: 英文模板挂载源文件 BEK-500L 导出命名 ---');
const enPath = fileURLToPath(new URL('../public/templates/正式模板_MSDS_EN_冠志(1).docx', import.meta.url));
const enBuf = fs.readFileSync(enPath);
const engineEn = await loadDocx(enBuf, '正式模板_MSDS_EN_冠志(1).docx');
const bekName = buildExportDocxName(engineEn, {
  templateName: 'EN 冠志',
  sourcePreviewName: 'BEK-500L 原件.pdf',
});
console.log(`生成文件名: ${bekName}`);
assert.equal(bekName, 'BEK-500L msds_EN 冠志.docx');
console.log('✓ BEK-500L 英文导出命名验证通过！\n');

// 5. 国彩主体与英文 Guocai 判定
console.log('--- 测试用例 5: 国彩主体与英文 Guocai 导出命名 ---');
const guocaiCnName = buildExportDocxName(engineOs, {
  templateName: 'CN 国彩',
  productModel: 'PU-1034',
});
assert.equal(guocaiCnName, 'PU-1034 msds_CN 国彩.docx');

const guocaiEnName = buildExportDocxName(engineEn, {
  templateName: 'EN Guocai',
  productModel: 'PU-1034',
});
assert.equal(guocaiEnName, 'PU-1034 msds_EN Guocai.docx');
console.log('✓ 国彩中英文命名验证通过！\n');

// 6. 空模板安全兜底
console.log('--- 测试用例 6: 空模板安全兜底命名 ---');
const cnPath = fileURLToPath(new URL('../public/templates/正式模板_MSDS_CN_冠志(1).docx', import.meta.url));
const cnBuf = fs.readFileSync(cnPath);
const engineCn = await loadDocx(cnBuf, '正式模板_MSDS_CN_冠志(1).docx');
const cnFallback = buildExportDocxName(engineCn, { templateName: 'CN 冠志' });
assert.equal(cnFallback, 'MSDS msds_CN 冠志.docx');

const enFallback = buildExportDocxName(engineEn, { templateName: 'EN 冠志' });
assert.equal(enFallback, 'MSDS msds_EN 冠志.docx');
console.log('✓ 空白中文/英文模板安全兜底为 "MSDS msds_CN 冠志.docx" / "MSDS msds_EN 冠志.docx"！\n');

console.log('======================================================');
console.log('🎉 MSDS-Engine 导出 DOCX 文件命名规范自动化测试 100% 通过！');
console.log('======================================================\n');
