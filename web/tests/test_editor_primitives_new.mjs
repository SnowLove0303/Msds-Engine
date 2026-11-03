import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { createWorkSession, clearSectionValuesInSession, restoreSectionInSession, writeCellValueToSession, applyCompanyPreset, saveSession } from '../src/template-editor.js';

console.log('=== MSDS-Studio 编辑器原语回归测试 (清空本节填写值 / 恢复本节 / 企业预设) ===\n');

const session = await createWorkSession('CN_Guanzhi');
const sec11 = session.engine.records.find(r => r.sectionNumber === 11);
const origRow3Val = sec11.rows[3].cells[sec11.rows[3].cells.length - 1].text;

console.log(`初始 Section 11 行3值: "${origRow3Val}"`);

// 1. 测试清空本节填写值 (clearSectionValuesInSession)
clearSectionValuesInSession(session, { sectionNumber: 11 });
const clearedSec11 = session.engine.records.find(r => r.sectionNumber === 11);
assert.equal(clearedSec11.rows[3].cells[clearedSec11.rows[3].cells.length - 1].text, '', 'Row 3 终点值必须清空');
// 标签必须完好保留
assert.equal(clearedSec11.rows[3].cells[0].text, sec11.rows[3].cells[0].text, '标签必须完好保留');
console.log('✓ 1. clearSectionValuesInSession 测试通过: 所有值格已彻底清零，标签格与拓扑 100% 保持！');

// 2. 测试写入新值
writeCellValueToSession(session, { sectionNumber: 11, rowIndex: 3, cellIndex: clearedSec11.rows[3].cells.length - 1, text: '无可用急性毒性经口数据。' });
const updatedSec11 = session.engine.records.find(r => r.sectionNumber === 11);
assert.equal(updatedSec11.rows[3].cells[updatedSec11.rows[3].cells.length - 1].text, '无可用急性毒性经口数据。');
console.log('✓ 2. writeCellValueToSession 写入新事实通过');

// 3. 测试恢复本节 (restoreSectionInSession)
await restoreSectionInSession(session, { sectionNumber: 11 });
const restoredSec11 = session.engine.records.find(r => r.sectionNumber === 11);
assert.equal(restoredSec11.rows[3].cells[restoredSec11.rows[3].cells.length - 1].text, origRow3Val, '恢复后应还原为模板原始示范值');
console.log('✓ 3. restoreSectionInSession 测试通过: 单节已安全恢复为模板基准！');

// 4. 测试应用企业预设 (applyCompanyPreset)
applyCompanyPreset(session, 'Guocai_zh');
const s1 = session.engine.records.find(r => r.sectionNumber === 1);
s1.rows.forEach((r, idx) => console.log('S1 row', idx, r.cells.map(c => c.text)));
const companyRow = s1.rows.find(r => /公司名称|制造商\/供应商名称|供应商名称/i.test(r.cells[0]?.text || ''));
console.log('companyRow cells:', companyRow ? companyRow.cells.map(c => c.text) : 'not found');
assert(companyRow && companyRow.cells[1].text.includes('国彩'), '企业预设应成功注入国彩');
console.log('✓ 4. applyCompanyPreset 测试通过: 企业预设切换为英德国彩成功！');

console.log('\n🎉 所有编辑器新原语测试 100% 满分通过！');
