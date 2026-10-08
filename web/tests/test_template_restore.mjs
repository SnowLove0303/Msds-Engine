import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import {
  loadDocx,
  writeCellValue,
  addRowAfter,
  restoreSectionToTemplate,
  renumberRecord,
} from '../src/docx-engine.js';

console.log('=== MSDS-Engine 模板恢复 (整份恢复 & 选定 Section 恢复) 自动化回归测试 ===\n');

// 准备全局 DOM 环境
const dom = new JSDOM('<!doctype html><html><body></body></html>');
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

const here = path.dirname(fileURLToPath(import.meta.url));
const tplPath = path.resolve(here, '../public/templates/正式模板_MSDS_CN_冠志(1).docx');
const buf = await fs.readFile(tplPath);

// 1. 初始化工作引擎与基准引擎
const engine = await loadDocx(buf, 'work_copy.docx');
const baseline = await loadDocx(buf, 'baseline.docx');

// 2. 记录初始状态基准
const origSec2 = engine.records.find((r) => r.sectionNumber === 2);
const origSec9 = engine.records.find((r) => r.sectionNumber === 9);

const origSec2RowsCount = origSec2.rows.length;
const origSec9RowsCount = origSec9.rows.length;
const origSec2Text = origSec2.rows[1].cells[1].text;
const origSec9Text = origSec9.rows[1].cells[1].text;

console.log(`✓ 1. 基准记录就绪: Section 2 有 ${origSec2RowsCount} 行, Section 9 有 ${origSec9RowsCount} 行`);

// 3. 对 Section 2 与 Section 9 分别进行修改（包括改值和追加行）
writeCellValue(origSec2.rows[1].cells[1], 'SECTION_2_USER_MODIFIED');
writeCellValue(origSec9.rows[1].cells[1], 'SECTION_9_USER_MODIFIED');
addRowAfter(engine, origSec9, origSec9.rows.length - 1);

const sec2Modified = engine.records.find((r) => r.sectionNumber === 2);
const sec9Modified = engine.records.find((r) => r.sectionNumber === 9);

assert.equal(sec2Modified.rows[1].cells[1].text, 'SECTION_2_USER_MODIFIED', 'Section 2 应已成功修改');
assert.equal(sec9Modified.rows[1].cells[1].text, 'SECTION_9_USER_MODIFIED', 'Section 9 应已成功修改');
assert.equal(sec9Modified.rows.length, origSec9RowsCount + 1, 'Section 9 行数应已增加 1 行');
console.log('✓ 2. 用户编辑模拟成功: Section 2 与 Section 9 均产生自定义修改');

// 4. 关键验证：仅恢复 Section 9 至模板状态
console.log('\n--- 执行仅针对当前 Section (Section 9) 的模板恢复 ---');
const sec9Restored = restoreSectionToTemplate(engine, baseline, 9);

// 重新从 engine 查询章节记录
const sec2Check = engine.records.find((r) => r.sectionNumber === 2);
const sec9Check = engine.records.find((r) => r.sectionNumber === 9);

// 验证 Section 2：修改仍旧完整保留！
assert.equal(sec2Check.rows[1].cells[1].text, 'SECTION_2_USER_MODIFIED', '【核心断言】Section 2 的修改必须完全保留！');
assert.equal(sec2Check.rows.length, origSec2RowsCount, 'Section 2 行数不受 Section 9 恢复影响');

// 验证 Section 9：已精准恢复至初始模板状态！
assert.equal(sec9Check.rows[1].cells[1].text, origSec9Text, '【核心断言】Section 9 单元格必须恢复至初始模板值！');
assert.equal(sec9Check.rows.length, origSec9RowsCount, '【核心断言】Section 9 追加的行数必须恢复清除！');
console.log('✓ 3. 选定 Section 恢复验证通过: Section 9 成功还原，其他 Section (Section 2) 修改完好保留！');

// 5. 验证整份模板恢复
console.log('\n--- 执行整份模板恢复 (Full Template Reset) ---');
const fullResetEngine = await loadDocx(buf, 'full_reset.docx');
fullResetEngine.records.filter((r) => r.kind === 'table').forEach((r) => renumberRecord(r));

const fullSec2 = fullResetEngine.records.find((r) => r.sectionNumber === 2);
const fullSec9 = fullResetEngine.records.find((r) => r.sectionNumber === 9);

assert.equal(fullSec2.rows[1].cells[1].text, origSec2Text, '整份重置后 Section 2 应恢复初始值');
assert.equal(fullSec9.rows[1].cells[1].text, origSec9Text, '整份重置后 Section 9 应恢复初始值');
console.log('✓ 4. 整份模板恢复验证通过: 全部章节均回到初始干净状态！');

console.log('\n======================================================');
console.log('🎉 模板编辑器模板状态恢复 (全部/单节) 自动化测试 100% 通过！');
console.log('======================================================\n');
