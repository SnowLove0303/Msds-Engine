import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';

const dom = new JSDOM();
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const {
  loadDocx,
  writeCellValue,
  getCellSemanticKey,
  findCellBySemanticKey,
  extractSemanticSnapshot,
  applySemanticOverrides,
  PresetStore,
  SYSTEM_BUILTIN_PRESETS,
} = await import('../src/docx-engine.js');

console.log('[Test] 开始测试语义化键与预设引擎...');

// 1. 载入 CN 冠志模板
const templateCnPath = path.resolve(__dirname, '../public/templates/正式模板_MSDS_CN_冠志(1).docx');
const bufCn = fs.readFileSync(templateCnPath);
const engineCn = await loadDocx(bufCn, '正式模板_MSDS_CN_冠志(1).docx');

// 验证 Section 1 语义键识别
const s1 = engineCn.records.find((r) => r.sectionNumber === 1);
assert.ok(s1, 'Section 1 should exist');

const chemCatCellCn = findCellBySemanticKey(engineCn, 'sec1.chemical_category');
assert.ok(chemCatCellCn, 'Should find sec1.chemical_category in CN template');
console.log('[Test] CN 模板化学品分类初始值:', chemCatCellCn.text);

// 2. 载入 EN 冠志模板
const templateEnPath = path.resolve(__dirname, '../public/templates/正式模板_MSDS_EN_冠志(1).docx');
const bufEn = fs.readFileSync(templateEnPath);
const engineEn = await loadDocx(bufEn, '正式模板_MSDS_EN_冠志(1).docx');

const chemCatCellEn = findCellBySemanticKey(engineEn, 'sec1.chemical_category');
assert.ok(chemCatCellEn, 'Should find sec1.chemical_category in EN template');
console.log('[Test] EN 模板化学品分类初始值:', chemCatCellEn.text);

// 3. 模拟用户需求：基准版设置分类 111，预设覆盖分类 222
writeCellValue(chemCatCellCn, '111');
assert.equal(chemCatCellCn.text, '111', 'Base value should be 111');
console.log('[Test] 基准引擎分类已设为 111');

// 提取快照
const snapshot = extractSemanticSnapshot(engineCn);
assert.equal(snapshot['sec1.chemical_category'], '111');

// 模拟应用国彩预设覆写：将分类改为 222
const guocaiPreset = SYSTEM_BUILTIN_PRESETS[0];
const overrides = {
  ...guocaiPreset.fieldOverrides,
  'sec1.chemical_category': '222',
};

const count = applySemanticOverrides(engineCn, overrides);
assert.ok(count >= 2, 'Should apply at least 2 overrides');
assert.equal(chemCatCellCn.text, '222', 'Override value should be 222');
console.log('[Test] 国彩预设覆写后分类值已变为 222！');

// 4. 验证在 EN 模板上同样能应用该覆写
writeCellValue(chemCatCellEn, '111');
applySemanticOverrides(engineEn, { 'sec1.chemical_category': '222' });
assert.equal(chemCatCellEn.text, '222', 'EN template override should be 222');
console.log('[Test] EN 模板跨模板覆写 222 同样生效！');

// 5. 验证 PresetStore
const presets = PresetStore.loadPresets();
assert.equal(presets.length, 2);
assert.equal(presets[0].id, 'preset_guocai_cn');
assert.equal(presets[1].id, 'preset_guocai_en');
console.log('[Test] PresetStore 加载系统内置预设成功');

console.log('✅ [PASSED] 语义化键与预设引擎单元测试全部通过！');
