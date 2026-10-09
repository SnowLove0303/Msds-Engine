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
  findCellBySemanticKey,
  clearCellValue,
  clearSectionValues,
  applyPresetPriorityOverlay,
  updateHeaderFooterData,
} = await import('../src/docx-engine.js');

console.log('[Test] 开始测试值清空功能与预设优先级覆盖逻辑...');

// 1. 载入 CN 冠志模板
const templatePath = path.resolve(__dirname, '../public/templates/正式模板_MSDS_CN_冠志(1).docx');
const buf = fs.readFileSync(templatePath);
const baseEngine = await loadDocx(buf, 'base.docx');

// === 测试 1: 值清空功能 (Clear Value) ===
const s1 = baseEngine.records.find((r) => r.sectionNumber === 1);
const chemCatCell = findCellBySemanticKey(baseEngine, 'sec1.chemical_category');
assert.ok(chemCatCell, 'Should find chemical_category cell');
writeCellValue(chemCatCell, '测试分类111');
assert.equal(chemCatCell.text, '测试分类111');

// 单格清空
const clearedSingle = clearCellValue(chemCatCell);
assert.equal(clearedSingle, true);
assert.equal(chemCatCell.text, '', 'Cell text should be cleared to empty string');
console.log('✅ [PASSED] 单元格单项清空功能验证通过');

// 整节清空
writeCellValue(chemCatCell, '测试值再次填入');
const nameCell = findCellBySemanticKey(baseEngine, 'sec1.product_name');
writeCellValue(nameCell, '测试名称');
const countCleared = clearSectionValues(s1);
assert.ok(countCleared > 0, 'Should clear multiple cells in section');
assert.equal(chemCatCell.text, '');
assert.equal(nameCell.text, '');
console.log(`✅ [PASSED] 章节整节一键清空功能验证通过（共清空 ${countCleared} 个可编辑单元格）`);

// === 测试 2: 预设优先级覆盖措施 (Priority Override) ===
// 模拟用户场景：
// 普通编辑模式 (主文档)：设置型号 OS-1338，名称 OS-1338，分类 111，公司 广州冠志
updateHeaderFooterData(baseEngine, { model: 'OS-1338', company: '广州冠志新材料科技有限公司' });
writeCellValue(nameCell, 'OS-1338');
writeCellValue(chemCatCell, '111');

// 预设编辑模式 (用户在编辑器里编辑预设并保存)：
// 在预设里：用户把分类改成了 222，把公司改成了国彩，而名称故意留空（""）希望继承主文档！
const customPreset = {
  id: 'preset_guocai_priority',
  name: '英德国彩覆盖预设',
  targetTemplate: 'CN 国彩',
  headerFooterOverrides: {
    company: '英德市国彩新材料有限公司',
    customFileNamePattern: '{model} msds_CN 国彩.docx',
  },
  fieldOverrides: {
    'sec1.chemical_category': '222', // 优先级覆盖：应覆盖为 222
    'sec1.product_name': '',         // 留空未填：应继承普通模式的 OS-1338
    'sec1.supplier.name': '英德市国彩新材料有限公司',
  },
};

// 执行优先级覆盖合并
const presetEngine = await loadDocx(buf, 'preset.docx');
applyPresetPriorityOverlay(baseEngine, customPreset, presetEngine);

// 验证优先级覆盖结果
const targetNameCell = findCellBySemanticKey(presetEngine, 'sec1.product_name');
const targetCatCell = findCellBySemanticKey(presetEngine, 'sec1.chemical_category');
const targetSupplierCell = findCellBySemanticKey(presetEngine, 'sec1.supplier.name');

// 断言：预设填了 222 -> 优先级覆盖为 222！
assert.equal(targetCatCell.text, '222', 'Preset chemical_category must override base value to 222');
// 断言：预设填了国彩 -> 优先级覆盖为国彩！
assert.equal(targetSupplierCell.text, '英德市国彩新材料有限公司');
assert.equal(presetEngine.headerFooterData.company, '英德市国彩新材料有限公司');

// 断言：预设留空未填 -> 完美继承普通模式的 OS-1338！
assert.equal(targetNameCell.text, 'OS-1338', 'Preset empty product_name must inherit base OS-1338');
assert.equal(presetEngine.headerFooterData.model, 'OS-1338', 'Model must inherit base OS-1338');

console.log('✅ [PASSED] 预设优先级覆盖措施（预设非空优先覆盖，预设留空继承主稿）验证完全正确！');

// === 测试 3: 导出双 DOCX 并重新解析反向验证 ===
const baseDocxBuf = await baseEngine.exportArrayBuffer();
const presetDocxBuf = await presetEngine.exportArrayBuffer();

const verifyBase = await loadDocx(baseDocxBuf, 'out_base.docx');
assert.equal(findCellBySemanticKey(verifyBase, 'sec1.chemical_category').text, '111');
assert.equal(findCellBySemanticKey(verifyBase, 'sec1.product_name').text, 'OS-1338');

const verifyPreset = await loadDocx(presetDocxBuf, 'out_preset.docx');
assert.equal(findCellBySemanticKey(verifyPreset, 'sec1.chemical_category').text, '222');
assert.equal(findCellBySemanticKey(verifyPreset, 'sec1.product_name').text, 'OS-1338');

console.log('✅ [PASSED] 双 DOCX 文件反向字节流解析验证通过：基准版(111) 与 预设版(222 继承 OS-1338) 完美匹配！');
console.log('\n🎉 全部测试 100% 绿色通过！');
