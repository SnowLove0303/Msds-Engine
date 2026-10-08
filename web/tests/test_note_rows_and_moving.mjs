import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import {
  loadDocx,
  addNoteRowAfter,
  addRowAfter,
  moveRowUp,
  moveRowDown,
  auditEngine,
  renumberRecord,
} from '../src/docx-engine.js';

console.log('=== MSDS-Engine 单列说明行创建与自由移动行测试 ===\n');

// 准备全局 DOM 环境
const dom = new JSDOM('<!doctype html><html><body></body></html>');
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

const here = path.dirname(fileURLToPath(import.meta.url));
const tplPath = path.resolve(here, '../public/templates/正式模板_MSDS_CN_冠志(1).docx');
const buf = await fs.readFile(tplPath);

const engine = await loadDocx(buf, 'work_copy.docx');
engine.records.filter((r) => r.kind === 'table').forEach((r) => renumberRecord(r));

// ----------------------------------------------------
// 测试用例 1: 在 Section 11 中插入单列说明行
// ----------------------------------------------------
console.log('--- 测试用例 1: 在 Section 11 数据行后插入单列说明行 ---');
const sec11 = engine.records.find((r) => r.kind === 'table' && r.sectionNumber === 11);
const origS11Rows = sec11.rows.length;

// 在 Row 3 (11.1) 后面插入说明行
const afterNote = addNoteRowAfter(engine, sec11, 3, '本产品急毒性试验数据补充说明');
assert.equal(afterNote.rows.length, origS11Rows + 1, '插入说明行后行数应 +1');

const insertedRow = afterNote.rows[4];
assert.equal(insertedRow.cells.length, 1, '【核心断言】单列说明行应且仅有 1 个单元格');
assert.equal(insertedRow.cells[0].kind, 'note', '单元格类型应自动识别为 note');
assert.equal(insertedRow.cells[0].editable, true, '说明行单元格应为可编辑状态');
assert.equal(insertedRow.cells[0].text, '本产品急毒性试验数据补充说明', '说明行内容应正确');
assert.match(afterNote.rows[3].cells[0].text, /^11\.1\b/, '前序 11.1 行不受影响');
console.log('✓ 单列说明行创建成功 (单列通栏、可编辑、类型为 note)！');

// ----------------------------------------------------
// 测试用例 2: 自由移动说明行位置 (上移至 11.1 之前，再下移)
// ----------------------------------------------------
console.log('\n--- 测试用例 2: 自由移动说明行 (上移至 11.1 之前) ---');
const afterMoveUp = moveRowUp(engine, afterNote, 4);
assert.equal(afterMoveUp.rows[3].cells[0].text, '本产品急毒性试验数据补充说明', '【核心断言】说明行成功上移至 Row 3 (11.1 之前)！');
assert.match(afterMoveUp.rows[4].cells[0].text, /^11\.1\b/, '原 11.1 行顺延为 Row 4，且编号保持连贯！');
console.log('✓ 说明行自由上移成功！');

console.log('\n--- 自由移动说明行 (下移恢复) ---');
const afterMoveDown = moveRowDown(engine, afterMoveUp, 3);
assert.match(afterMoveDown.rows[3].cells[0].text, /^11\.1\b/, '11.1 行恢复至 Row 3');
assert.equal(afterMoveDown.rows[4].cells[0].text, '本产品急毒性试验数据补充说明', '说明行恢复至 Row 4');
console.log('✓ 说明行自由下移成功！');

// ----------------------------------------------------
// 测试用例 3: 在节顶部（Row 0 之后）插入顶部说明行
// ----------------------------------------------------
console.log('\n--- 测试用例 3: 在节顶部 (Row 0 章节标题后) 插入顶部说明行 ---');
const afterTopNote = addNoteRowAfter(engine, afterMoveDown, 0, '【本产品无可用的毒理学补充说明】');
assert.equal(afterTopNote.rows[1].cells[0].text, '【本产品无可用的毒理学补充说明】', '【核心断言】Row 1 成功插入为顶部说明行！');
assert.equal(afterTopNote.rows[1].cells.length, 1, '顶部说明行为单列');
console.log('✓ 节顶部单列说明行插入成功！');

// ----------------------------------------------------
// 测试用例 4: 数据行自由移动后自动重新排序
// ----------------------------------------------------
console.log('\n--- 测试用例 4: 数据行自由移动与序号自动重新排序 ---');
const sec9 = engine.records.find((r) => r.kind === 'table' && r.sectionNumber === 9);
const origRow2Text = sec9.rows[2].cells[0].text;
const origRow3Text = sec9.rows[3].cells[0].text;

// 下移 Row 2
const afterSec9Move = moveRowDown(engine, sec9, 2);
assert.match(afterSec9Move.rows[1].cells[0].text, /^9\.1\b/, 'Row 1 仍为 9.1');
assert.match(afterSec9Move.rows[2].cells[0].text, /^9\.2\b/, '移动后 Row 2 序号自动保持 9.2！');
assert.match(afterSec9Move.rows[3].cells[0].text, /^9\.3\b/, '移动后 Row 3 序号自动保持 9.3！');
console.log('✓ 数据行互换移动后，序号严格重新排序 9.1, 9.2, 9.3 连贯递增！');

// ----------------------------------------------------
// 测试用例 5: 保护行校验
// ----------------------------------------------------
console.log('\n--- 测试用例 5: 结构边界与保护行校验 ---');
assert.throws(() => moveRowUp(engine, sec9, 0), /章节标题行/, '禁止移动 Row 0 标题行');
assert.throws(() => moveRowUp(engine, sec9, 1), /无法继续上移/, 'Row 1 无法跨越 Row 0 继续上移');
assert.throws(() => moveRowDown(engine, sec9, sec9.rows.length - 1), /无法继续下移/, '末尾行无法继续下移');
console.log('✓ 保护行与边界校验全部生效！');

// ----------------------------------------------------
// 测试用例 6: 审计系统联动校验
// ----------------------------------------------------
console.log('\n--- 测试用例 6: 审计合规校验 ---');
const auditErrors = auditEngine(engine);
assert.equal(auditErrors.length, 0, `审计应无错误，实际错误: ${JSON.stringify(auditErrors)}`);
console.log('✓ 审计系统校验通过: 0 错误！');

console.log('\n======================================================');
console.log('🎉 单列说明行创建与自由移动位置自动化测试 100% 通过！');
console.log('======================================================\n');
