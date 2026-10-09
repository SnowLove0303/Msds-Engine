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
  extractSemanticSnapshot,
  applySemanticOverrides,
  updateHeaderFooterData,
  SYSTEM_BUILTIN_PRESETS,
} = await import('../src/docx-engine.js');

console.log('[Scenario Test] 开始模拟用户全流程：冠志底稿(111) + 国彩覆写(222) -> 双文件同步导出');

// 1. 载入 CN 冠志模板作为基准底稿
const templateCnPath = path.resolve(__dirname, '../public/templates/正式模板_MSDS_CN_冠志(1).docx');
const bufCn = fs.readFileSync(templateCnPath);
const baseEngine = await loadDocx(bufCn, '正式模板_MSDS_CN_冠志(1).docx');

// 2. 基准编辑：设置产品型号 OS-1338，名称 OS-1338，化学品分类 111
updateHeaderFooterData(baseEngine, { model: 'OS-1338', company: '广州冠志新材料科技有限公司' });

const nameCell = findCellBySemanticKey(baseEngine, 'sec1.product_name');
assert.ok(nameCell, 'Should find product_name cell');
writeCellValue(nameCell, 'OS-1338');

const catCell = findCellBySemanticKey(baseEngine, 'sec1.chemical_category');
assert.ok(catCell, 'Should find chemical_category cell');
writeCellValue(catCell, '111');

console.log('[Scenario Test] 基准设置完成: 名称=OS-1338, 分类=111');

// 3. 激活预设：英德国彩主体 (CN)，原位覆写分类为 222
const guocaiPreset = JSON.parse(JSON.stringify(SYSTEM_BUILTIN_PRESETS[0]));
guocaiPreset.fieldOverrides = {
  ...guocaiPreset.fieldOverrides,
  'sec1.chemical_category': '222',
};

// 4. 同步导出管线模拟
// 4.1 导出基准版 DOCX
const baseDocxBuf = await baseEngine.exportArrayBuffer();

// 4.2 导出国彩衍生版 DOCX
const presetEngine = await loadDocx(bufCn, '正式模板_MSDS_CN_国彩.docx');
// 提取基准全部语义快照并同步
const baseSnapshot = extractSemanticSnapshot(baseEngine);
applySemanticOverrides(presetEngine, baseSnapshot);
// 应用国彩特有覆写
applySemanticOverrides(presetEngine, guocaiPreset.fieldOverrides);
// 应用国彩特有页眉页脚
updateHeaderFooterData(presetEngine, {
  model: 'OS-1338',
  company: guocaiPreset.headerFooterOverrides.company,
});
const presetDocxBuf = await presetEngine.exportArrayBuffer();

console.log('[Scenario Test] 成功生成两份 DOCX 字节流');

// 5. 反向重新解析生成的两份 DOCX，严格验证实际内容
const verifyBaseEngine = await loadDocx(baseDocxBuf, 'output_guanzhi.docx');
const verifyBaseCat = findCellBySemanticKey(verifyBaseEngine, 'sec1.chemical_category');
const verifyBaseName = findCellBySemanticKey(verifyBaseEngine, 'sec1.product_name');
assert.equal(verifyBaseName.text, 'OS-1338', 'Base product name should be OS-1338');
assert.equal(verifyBaseCat.text, '111', 'Base chemical category must be 111');
assert.equal(verifyBaseEngine.headerFooterData.company, '广州冠志新材料科技有限公司');
console.log('✅ 冠志基准版验证通过：型号=OS-1338, 分类=111, 主体=广州冠志新材料科技有限公司');

const verifyPresetEngine = await loadDocx(presetDocxBuf, 'output_guocai.docx');
const verifyPresetCat = findCellBySemanticKey(verifyPresetEngine, 'sec1.chemical_category');
const verifyPresetName = findCellBySemanticKey(verifyPresetEngine, 'sec1.product_name');
assert.equal(verifyPresetName.text, 'OS-1338', 'Preset product name should inherit OS-1338');
assert.equal(verifyPresetCat.text, '222', 'Preset chemical category must be overridden to 222');
assert.equal(verifyPresetEngine.headerFooterData.company, '英德市国彩新材料有限公司');
console.log('✅ 国彩预设版验证通过：型号=OS-1338(继承), 分类=222(覆写), 主体=英德市国彩新材料有限公司');

console.log('\n🎉 [SCENARIO SUCCESS] 局部同步覆写双版本导出场景 100% 验收通过！');
