import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import {
  loadDocx,
  addRowAfter,
  deleteRow,
  renumberRecord,
  auditEngine,
} from '../src/docx-engine.js';

console.log('=== MSDS-Engine 增删行自动重新排序回归测试 ===\n');

// 准备全局 DOM 环境
const dom = new JSDOM('<!doctype html><html><body></body></html>');
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

const here = path.dirname(fileURLToPath(import.meta.url));
const tplPath = path.resolve(here, '../public/templates/正式模板_MSDS_CN_冠志(1).docx');
const buf = await fs.readFile(tplPath);

// 1. 初始化引擎
const engine = await loadDocx(buf, 'work_copy.docx');
const sec9 = engine.records.find((r) => r.kind === 'table' && r.sectionNumber === 9);
const origCount = sec9.rows.length;

// 验证原始编号
assert.match(sec9.rows[1].cells[0].text, /^9\.1\b/, 'Row 1 原始应为 9.1');
assert.match(sec9.rows[2].cells[0].text, /^9\.2\b/, 'Row 2 原始应为 9.2');
assert.match(sec9.rows[3].cells[0].text, /^9\.3\b/, 'Row 3 原始应为 9.3');
console.log(`✓ 1. Section 9 原始状态就绪 (共 ${origCount} 行)`);

// 2. 在 Row 2 (9.2) 之后增行
console.log('\n--- 测试用例 1: 在 Row 2 (9.2) 后增行 ---');
const afterAdd = addRowAfter(engine, sec9, 2);
assert.equal(afterAdd.rows.length, origCount + 1, '增行后总行数应 +1');

// 断言序号完全重新排序
assert.match(afterAdd.rows[1].cells[0].text, /^9\.1\b/, 'Row 1 应保持 9.1');
assert.match(afterAdd.rows[2].cells[0].text, /^9\.2\b/, 'Row 2 应保持 9.2');
assert.match(afterAdd.rows[3].cells[0].text, /^9\.3\b/, '【核心断言】新克隆行应自动重新排序为 9.3！');
assert.match(afterAdd.rows[4].cells[0].text, /^9\.4\b/, '【核心断言】原 9.3 行应自动顺延为 9.4！');
assert.match(afterAdd.rows[5].cells[0].text, /^9\.5\b/, '【核心断言】原 9.4 行应自动顺延为 9.5！');
console.log('✓ 增行序号自动重排验证通过: 9.1, 9.2, 9.3(新), 9.4, 9.5 连续递增无重号！');

// 3. 再次增行测试连续性
console.log('\n--- 测试用例 2: 再次在 Row 3 (9.3) 后增行 ---');
const afterAdd2 = addRowAfter(engine, afterAdd, 3);
assert.equal(afterAdd2.rows.length, origCount + 2, '再次增行后总行数应 +2');
assert.match(afterAdd2.rows[3].cells[0].text, /^9\.3\b/, 'Row 3 应为 9.3');
assert.match(afterAdd2.rows[4].cells[0].text, /^9\.4\b/, '【核心断言】第二次增行新行应为 9.4！');
assert.match(afterAdd2.rows[5].cells[0].text, /^9\.5\b/, '【核心断言】后续行应顺延为 9.5！');
assert.match(afterAdd2.rows[6].cells[0].text, /^9\.6\b/, '【核心断言】后续行应顺延为 9.6！');
console.log('✓ 连续增行序号自动重排验证通过！');

// 4. 删除行测试（删除 Row 2 即 9.2 行）
console.log('\n--- 测试用例 3: 删除 Row 2 (9.2) 行 ---');
const afterDel = deleteRow(engine, afterAdd2, 2);
assert.equal(afterDel.rows.length, origCount + 1, '删除后行数应减少 1 行');
assert.match(afterDel.rows[1].cells[0].text, /^9\.1\b/, 'Row 1 应为 9.1');
assert.match(afterDel.rows[2].cells[0].text, /^9\.2\b/, '【核心断言】删行后后续行应向前补位重排为 9.2！');
assert.match(afterDel.rows[3].cells[0].text, /^9\.3\b/, '【核心断言】后续行应向前补位重排为 9.3！');
assert.match(afterDel.rows[4].cells[0].text, /^9\.4\b/, '【核心断言】后续行应向前补位重排为 9.4！');
console.log('✓ 删行序号向前补位自动重排验证通过！');

// 5. 校验审计系统：确保整篇文档无序号断号或重号错误
console.log('\n--- 测试用例 4: 审计合规校验 ---');
const auditErrors = auditEngine(engine);
assert.equal(auditErrors.length, 0, `审计应无错误，实际错误: ${JSON.stringify(auditErrors)}`);
console.log('✓ 审计校验通过: 0 序号错误！');

console.log('\n======================================================');
console.log('🎉 MSDS-Engine 增删行序号自动重新排序测试 100% 通过！');
console.log('======================================================\n');
