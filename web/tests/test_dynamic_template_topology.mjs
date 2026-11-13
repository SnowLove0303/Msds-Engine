import assert from 'node:assert';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { recognizeTemplateTopology } from '../src/template-topology-recognizer.js';
import { matchContext1ToDynamicTemplateTopology } from '../src/smart-matching.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '../..');

console.log('🧪 开始运行动态模板拓扑识别层与自适应匹配单元测试...\n');

// 1. 测试中文母版 CN_Guanzhi 识别
console.log('▶ [1/4] 测试中文母版 CN_Guanzhi 动态拓扑解析...');
const cnTopology = await recognizeTemplateTopology('CN_Guanzhi');

assert.strictEqual(cnTopology.templateKey, 'CN_Guanzhi');
assert.strictEqual(cnTopology.isTopologyDynamic, true);
assert.strictEqual(cnTopology.sectionsCount, 16, '必须完整识别 16 个章节表格');

const sec1 = cnTopology.sections.find(s => s.sectionNumber === 1);
assert.ok(sec1, '必须识别第 1 章节');
assert.ok(sec1.slots.length > 0, '第 1 章节必须包含插槽');
assert.ok(sec1.columnWidths.length >= 2, '第 1 章节必须包含列宽定义');
console.log(`  ✓ CN_Guanzhi: 识别到 16 章节, Sec1 包含 ${sec1.slots.length} 个插槽, 布局: ${sec1.layoutType}`);

// 2. 测试英文母版 EN_Guanzhi 识别
console.log('\n▶ [2/4] 测试英文母版 EN_Guanzhi 动态拓扑解析...');
const enTopology = await recognizeTemplateTopology('EN_Guanzhi');

assert.strictEqual(enTopology.templateKey, 'EN_Guanzhi');
assert.strictEqual(enTopology.sectionsCount, 16, '英文母版必须完整识别 16 个章节表格');
const enSec1 = enTopology.sections.find(s => s.sectionNumber === 1);
assert.ok(enSec1, '英文母版必须识别第 1 章节');
console.log(`  ✓ EN_Guanzhi: 识别到 16 章节, Sec1 包含 ${enSec1.slots.length} 个插槽, 布局: ${enSec1.layoutType}`);

// 3. 测试事实与动态拓扑咬合
console.log('\n▶ [3/4] 测试事实与动态拓扑智能咬合 (matchContext1ToDynamicTemplateTopology)...');
const mockFacts = {
  modelCode: 'HPU-TEST',
  productName: '羟基聚氨酯分散体',
  productNameEn: 'Hydroxy Polyurethane Dispersion',
  recommendedUse: '涂料用树脂',
  company: {
    name: '广州市冠志新材料科技有限公司',
    emergencyPhone: '020-82001201'
  },
  transport: {
    unNumber: 'Not applicable',
    shippingName: 'Non-hazardous goods'
  },
  ghs: { isHazardous: false }
};

const cnMatched = matchContext1ToDynamicTemplateTopology(mockFacts, cnTopology, 'CN');
assert.strictEqual(cnMatched.modelCode, 'HPU-TEST');
assert.strictEqual(cnMatched.templateKey, 'CN_Guanzhi');
assert.strictEqual(cnMatched.sections.length, 16);

// 验证槽位事实注入
const mSec1 = cnMatched.sections.find(s => s.sectionNumber === 1);
const nameSlot = mSec1.slots.find(s => s.slotKey === 'product_name');
assert.ok(nameSlot, '产品名称插槽必须匹配成功');
assert.strictEqual(nameSlot.value, '羟基聚氨酯分散体');
assert.strictEqual(nameSlot.sourceOrigin, 'source_grounded');
console.log(`  ✓ 中文事实动态咬合成功: slotKey=${nameSlot.slotKey}, value="${nameSlot.value}"`);

// 4. 测试母版切换时的拓扑自适应随动
console.log('\n▶ [4/4] 测试母版切换时的自适应拓扑随动...');
const enMatched = matchContext1ToDynamicTemplateTopology(mockFacts, enTopology, 'EN');
assert.strictEqual(enMatched.templateKey, 'EN_Guanzhi');
const enMSec1 = enMatched.sections.find(s => s.sectionNumber === 1);
const enNameSlot = enMSec1.slots.find(s => s.slotKey === 'product_name');
assert.ok(enNameSlot, '英文母版产品名称插槽必须匹配成功');
assert.strictEqual(enNameSlot.value, 'Hydroxy Polyurethane Dispersion');
console.log(`  ✓ 英文母版切换随动成功: templateKey=${enMatched.templateKey}, value="${enNameSlot.value}"`);

console.log('\n🎉 所有动态模板拓扑识别与自适应匹配单元断言 100% 验证通过！');
