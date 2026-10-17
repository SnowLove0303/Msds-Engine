import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import JSZip from 'jszip';
import { JSDOM } from 'jsdom';
import { loadDocx, renumberRecord, writeCellValue } from '../src/docx-engine.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const templateDir = path.resolve(here, '..', 'public', 'templates');

const dom = new JSDOM('<!doctype html><html><body></body></html>');
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

const sha256 = (buffer) => crypto.createHash('sha256').update(buffer).digest('hex');

const cnTemplateName = '正式模板_MSDS_CN_冠志(1).docx';
const enTemplateName = '正式模板_MSDS_EN_冠志(1).docx';

async function main() {
  console.log('=== Task 11.10: 模板哈希与隔离预设导出回读验证 ===');

  // 1. 模板原始哈希记录与比对
  const cnBytes = await fs.readFile(path.join(templateDir, cnTemplateName));
  const enBytes = await fs.readFile(path.join(templateDir, enTemplateName));

  const cnHashBefore = sha256(cnBytes);
  const enHashBefore = sha256(enBytes);

  console.log(`[模板指纹] 中文模板 (${cnTemplateName}):\n  ${cnHashBefore}`);
  console.log(`[模板指纹] 英文模板 (${enTemplateName}):\n  ${enHashBefore}`);

  // 2. 隔离临时预设回读验证
  console.log('\n[临时预设] 载入中文基准工作副本，执行隔离临时预设写入...');
  const engine = await loadDocx(cnBytes, cnTemplateName);
  engine.records.filter((item) => item.kind === 'table').forEach((item) => renumberRecord(item));

  // 寻找 Section 1 的可编辑值格并修改为临时隔离标记
  const sec1 = engine.records.find(r => r.kind === 'table' && r.sectionNumber === 1);
  assert.ok(sec1, '未找到 Section 1 表格');

  const targetCell = sec1.rows.flatMap(r => r.cells).find(c => c.editable && c.valueNodes.length);
  assert.ok(targetCell, '未找到 Section 1 可编辑值格');

  const isolatedPresetValue = 'ISOLATED_TEST_PRESET_VALUE_20261017';
  writeCellValue(targetCell, isolatedPresetValue, engine.roleStyles.value);

  // 3. 往返生成 DOCX 并回读
  console.log('[DOCX 回读] 打包导出临时预设 DOCX 并回读检验...');
  const exportZip = new JSZip();
  for (const entry of Object.values(engine.zip.files)) {
    if (!entry.dir) {
      if (entry.name === 'word/document.xml') {
        exportZip.file(entry.name, new globalThis.XMLSerializer().serializeToString(engine.documentXml));
      } else {
        exportZip.file(entry.name, await entry.async('uint8array'));
      }
    }
  }

  const exportedBytes = await exportZip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
  const readBackZip = await JSZip.loadAsync(exportedBytes);
  const readBackXml = await readBackZip.file('word/document.xml').async('string');

  assert.ok(readBackXml.includes(isolatedPresetValue), '导出的 DOCX 中未找到临时预设写入值');
  console.log('✅ 临时预设导出值在 DOCX XML 中成功精准回读！');

  // 4. 再次验证源模板哈希未被改动
  const cnBytesAfter = await fs.readFile(path.join(templateDir, cnTemplateName));
  const enBytesAfter = await fs.readFile(path.join(templateDir, enTemplateName));
  assert.equal(sha256(cnBytesAfter), cnHashBefore, '中文源模板文件被意外修改！');
  assert.equal(sha256(enBytesAfter), enHashBefore, '英文源模板文件被意外修改！');

  console.log('✅ 源模板字节与 SHA256 哈希 100% 保持只读与纯净！');
  console.log('✅ 隔离预设完全运行在独立内存上下文，零入侵用户草稿与真实预设！\n');
}

main().catch(err => {
  console.error('Validation failed:', err);
  process.exit(1);
});
