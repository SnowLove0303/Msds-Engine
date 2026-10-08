import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { loadDocx } from '../src/docx-engine.js';
import {
  runSmartMatching,
  applyMatchResultToEditor,
  sanitizeTypographyAndSymbols,
  groupPrecautionaryStatements,
  LINE_BREAK_POLICIES,
} from '../src/smart-matching.js';

const dom = new JSDOM('<!doctype html><html><body></body></html>');
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

console.log('=================================================================');
console.log('MSDS STUDIO 智能匹配结果语义换行策略全量自动化回归套件');
console.log('=================================================================\n');

// -------------------------------------------------------------
// 验证 1：换行与版式清洗器 (Typography & Slashes Sanitation)
// -------------------------------------------------------------
console.log('--- 验证 1：换行与版式清洗器（固定搭配保护与防机械拆行） ---');

// 1.1 零宽字符剔除
const zwText = sanitizeTypographyAndSymbols('水性聚氨酯\u200B分散体\uFEFF');
assert.equal(zwText, '水性聚氨酯分散体', '零宽字符必须被剔除');

// 1.2 保护化学/技术固定搭配不被斜杠机械折行
const compText = sanitizeTypographyAndSymbols('确保充分的 通风 / 排气，属于 物质 / 混合物，无 皮肤腐蚀 / 刺激');
assert.ok(compText.includes('通风/排气'), '通风/排气 固定搭配必须保真');
assert.ok(compText.includes('物质/混合物'), '物质/混合物 固定搭配必须保真');
assert.ok(compText.includes('皮肤腐蚀/刺激'), '皮肤腐蚀/刺激 固定搭配必须保真');
assert.ok(!compText.includes('\n'), '固定搭配中不得被机械插入换行符');

// 1.3 保护国标代号、度量衡与比例单位
const stdText = sanitizeTypographyAndSymbols('符合 GB / T 16483，含量 33.0% w / w，密度 1.05 g / cm³');
assert.ok(stdText.includes('GB/T 16483'), '国标代号 GB/T 必须保真');
assert.ok(stdText.includes('w/w'), '含量比例 w/w 必须保真');
assert.ok(stdText.includes('g/cm³'), '密度单位 g/cm³ 必须保真');

// 1.4 P260 多斜杠保护
const p260 = sanitizeTypographyAndSymbols('不要吸入粉尘 / 烟 / 气体 / 气雾 / 蒸气 / 喷雾。');
assert.ok(!p260.includes('\n'), 'P260 中的斜杠并列词不得被拆断成多行');
assert.equal(p260, '不要吸入粉尘/烟/气体/气雾/蒸气/喷雾。');

console.log('✓ 验证 1 全部通过！\n');

// -------------------------------------------------------------
// 验证 2：Section 2 防范说明多组单换行连接（杜绝无语义空行）
// -------------------------------------------------------------
console.log('--- 验证 2：P 语句分组单换行连接与零空白行断言 ---');

const rawP = `P201 在使用前获取特别指示。
P202 在阅读并了解所有安全预防措施之前，切勿操作。
预防措施：
P260 不要吸入粉尘/烟/气体。
事故响应：
P304+P340 如误吸入：转移到空气新鲜处。
安全储存：
P405 储存处须加锁。
废弃处置：
P501 处置内装物/容器。`;

const groupedP = groupPrecautionaryStatements(rawP);
assert.ok(!groupedP.includes('\n\n'), 'P 语句分组之间绝不能存在 \\n\\n 空白占位行！');
const pLines = groupedP.split('\n');
assert.equal(pLines[0], '预防措施：');
assert.ok(pLines.includes('事故响应：'));
assert.ok(pLines.includes('安全储存：'));
assert.ok(pLines.includes('废弃处置：'));

console.log('✓ 验证 2 全部通过！\n');

// -------------------------------------------------------------
// 验证 3：全 4 款产品（PU-1001 ~ PU-1004）语义换行与导出重载断言
// -------------------------------------------------------------
console.log('--- 验证 3：PU-1001 至 PU-1004 全章节语义换行与 DOCX Roundtrip 验证 ---');

const tplBuf = await fs.readFile(new URL('../public/templates/正式模板_MSDS_CN_冠志(1).docx', import.meta.url));

const models = ['PU-1001', 'PU-1002', 'PU-1003', 'PU-1004'];

for (const model of models) {
  console.log(`\n>>> 正在验证产品: ${model}`);
  const sPath = new URL(`../../scratch/standard-compare/${model}_source_CN.docx`, import.meta.url);
  const sBuf = await fs.readFile(sPath);

  const sDoc = await loadDocx(sBuf, `${model}_source.docx`);
  const tDoc = await loadDocx(tplBuf, `${model}_template.docx`);

  const matchResult = runSmartMatching(sDoc.records);

  // 3.1 验证数据模型属性完整性
  for (const sec of matchResult.matchedSections) {
    for (const row of sec.matchedRows) {
      assert(Array.isArray(row.logicalLines), `Section ${sec.sectionNumber} row ${row.key} 必须携带 logicalLines 数组`);
      assert(typeof row.lineBreakPolicy === 'string', `Section ${sec.sectionNumber} row ${row.key} 必须声明 lineBreakPolicy`);
      assert(typeof row.structuralDisposition === 'string', `Section ${sec.sectionNumber} row ${row.key} 必须声明 structuralDisposition`);
    }
  }

  // 3.2 注入模板
  applyMatchResultToEditor(matchResult, tDoc);

  // 3.3 导出 DOCX 二进制并使用 loadDocx 重新加载验证 (Roundtrip)
  const exportedBuf = await tDoc.exportArrayBuffer();
  assert(exportedBuf && exportedBuf.byteLength > 0, '导出的 DOCX 必须为非空二进制');
  const reloaded = await loadDocx(exportedBuf, `${model}_exported.docx`);

  // Section 2 校验：无 \n\n 空行
  const s2 = reloaded.records.find((r) => r.sectionNumber === 2);
  assert(s2, '必须存在 Section 2');
  for (const row of s2.rows) {
    for (const cell of row.cells) {
      assert(!cell.text.includes('\n\n'), `Section 2 单元格中不得包含 \\n\\n 空行，实际为: ${JSON.stringify(cell.text)}`);
    }
  }

  // Section 5 校验：5.3 与 5.4 独立陈述句 2 行
  const s5 = reloaded.records.find((r) => r.sectionNumber === 5);
  const s53 = s5.rows.find((r) => r.cells.some((c) => /特殊危害/i.test(c.text)));
  const s54 = s5.rows.find((r) => r.cells.some((c) => /预防措施和保护设备/i.test(c.text)));
  assert(s53, '必须存在 5.3 特殊危害行');
  assert(s54, '必须存在 5.4 消防保护设备行');
  const s53Lines = s53.cells[s53.cells.length - 1].text.split('\n').filter(Boolean);
  const s54Lines = s54.cells[s54.cells.length - 1].text.split('\n').filter(Boolean);
  assert.equal(s53Lines.length, 2, `5.3 必须严格包含 2 行逻辑陈述句，实际行数=${s53Lines.length}: ${JSON.stringify(s53Lines)}`);
  assert.equal(s54Lines.length, 2, `5.4 必须严格包含 2 行逻辑陈述句，实际行数=${s54Lines.length}: ${JSON.stringify(s54Lines)}`);

  // Section 6 校验：6.1 个人防护措施 2 行，包含固定搭配“通风/排气”
  const s6 = reloaded.records.find((r) => r.sectionNumber === 6);
  const s61 = s6.rows.find((r) => r.cells.some((c) => /个人预防措施/i.test(c.text)));
  assert(s61, '必须存在 6.1 个人预防措施行');
  const s61Val = s61.cells[s61.cells.length - 1].text;
  const s61Lines = s61Val.split('\n').filter(Boolean);
  assert.equal(s61Lines.length, 2, `6.1 必须严格包含 2 行逻辑指令，实际行数=${s61Lines.length}: ${JSON.stringify(s61Lines)}`);
  assert.ok(s61Val.includes('通风/排气'), '6.1 中的 通风/排气 必须保真');

  // Section 11 & 12 校验：严格独立行收敛为 2 行，不使用值内换行拼接
  const s11 = reloaded.records.find((r) => r.sectionNumber === 11);
  const s12 = reloaded.records.find((r) => r.sectionNumber === 12);
  assert.equal(s11.rows.length, 2, 'Section 11 必须收敛为 2 行');
  assert.equal(s12.rows.length, 2, 'Section 12 必须收敛为 2 行');

  // Section 13 校验：行 1 法规说明 2 行，行 2 处理方法 4 行
  const s13 = reloaded.records.find((r) => r.sectionNumber === 13);
  const s13Row1 = s13.rows[1];
  const s13Row2 = s13.rows[2];
  const s13Row1Lines = s13Row1.cells[0].text.split('\n').filter(Boolean);
  const s13Row2Lines = s13Row2.cells[s13Row2.cells.length - 1].text.split('\n').filter(Boolean);
  assert.equal(s13Row1Lines.length, 2, `Section 13 行1 必须为 2 行法规指令，实际为: ${JSON.stringify(s13Row1Lines)}`);
  assert.equal(s13Row2Lines.length, 4, `Section 13 行2 必须为 4 行废弃处置指令，实际为: ${JSON.stringify(s13Row2Lines)}`);

  // Section 14 校验：14.4 特殊注意 3 行
  const s14 = reloaded.records.find((r) => r.sectionNumber === 14);
  const s144 = s14.rows.find((r) => r.cells.some((c) => /特殊注意/i.test(c.text)));
  assert(s144, '必须存在 14.4 用户特殊注意行');
  const s144Lines = s144.cells[s144.cells.length - 1].text.split('\n').filter(Boolean);
  assert.equal(s144Lines.length, 3, `14.4 必须严格包含 3 行逻辑指令，实际行数=${s144Lines.length}: ${JSON.stringify(s144Lines)}`);

  // Section 15 校验：9 行独立法规行，不用值内换行糊弄
  const s15 = reloaded.records.find((r) => r.sectionNumber === 15);
  assert.equal(s15.rows.length, 9, 'Section 15 必须为 9 行独立法规行');

  console.log(`✓ ${model} 全 16 章节语义换行与 DOCX Roundtrip 校验通过！`);
}

console.log('\n=================================================================');
console.log('🎉 智能匹配结果语义换行策略体系所有断言 100% 全部通过！');
console.log('=================================================================\n');
