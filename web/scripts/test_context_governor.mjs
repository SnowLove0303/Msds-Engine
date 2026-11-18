import assert from 'node:assert';
import {
  CHEMICAL_TRANSLATION_DICT,
  TRANSPORT_TRANSLATION_MAP,
  translateChemicalTerm,
  sanitizeDegreeAndPunctuation,
  governContext
} from '../src/context-governor.js';

console.log('🧪 开始运行 context-governor 单元测试...');

// 1. 测试化学品英译
assert.strictEqual(translateChemicalTerm('水'), 'Water');
assert.strictEqual(translateChemicalTerm('去离子水'), 'Deionized water');
assert.strictEqual(translateChemicalTerm('噁唑啉改性丙烯酸聚合物'), 'Oxazoline-modified acrylic polymer');
assert.strictEqual(translateChemicalTerm('二丙二醇二甲醚'), 'Dipropylene glycol dimethyl ether');
assert.strictEqual(translateChemicalTerm('六甲撑二异氰酸酯基均聚物'), 'Hexamethylene diisocyanate homopolymer');
assert.strictEqual(translateChemicalTerm('商业秘密'), 'Trade secret');
assert.strictEqual(translateChemicalTerm('商业机密'), 'Trade secret');
console.log('✅ 1. 化学品英译字典与模式匹配通过');

// 2. 测试度数符号与标点规范化
assert.strictEqual(sanitizeDegreeAndPunctuation('100 C'), '100 °C');
assert.strictEqual(sanitizeDegreeAndPunctuation('100C'), '100 °C');
assert.strictEqual(sanitizeDegreeAndPunctuation('沸点: 100 C:'), '沸点: 100 °C');
console.log('✅ 2. 度数符号与标点规范化通过');

// 3. 测试 governContext 核心治理
const mockContext1 = {
  modelCode: 'TEST-100',
  ghs: {
    isHazardous: false,
    signalWord: '无',
    pictograms: ['无']
  },
  components: [
    { name: '噁唑啉改性丙烯酸聚合物', cas: '商业机密', conc: '40 %' },
    { name: '水', cas: '7732-18-5', conc: '60 %' }
  ],
  physicalProperties: [
    { label: '沸点', value: '100 C' }
  ],
  transport: {
    road: '非危险品陆运输方式。',
    sea: '非危险品海运方式。',
    air: '非危险品运输方式。',
    precautions: '非危险货物。'
  }
};

const governed = governContext(mockContext1);

// GHS 非危品防外生虚增契约
assert.strictEqual(governed.cn.ghs.isHazardous, false);
assert.strictEqual(governed.cn.ghs.signalWord, null);
assert.strictEqual(governed.cn.ghs.hasPictograms, false);
assert.strictEqual(governed.cn.ghs.pictogramCount, 0);

// 双语组分独立性与高保真英译
assert.strictEqual(governed.componentsEn.length, 2);
assert.strictEqual(governed.componentsEn[0].name, 'Oxazoline-modified acrylic polymer');
assert.strictEqual(governed.componentsEn[0].cas, 'Trade secret');
assert.strictEqual(governed.componentsEn[1].name, 'Water');
assert.strictEqual(governed.componentsEn[1].cas, '7732-18-5');

// 理化指标度数规范
assert.strictEqual(governed.cn.physicalProperties[0].value, '100 °C');

// 运输双语映射
assert.strictEqual(governed.en.transport.road, 'Not classified as dangerous goods for land transport.');
assert.strictEqual(governed.en.transport.sea, 'Not classified as dangerous goods for sea transport, in accordance with IMDG regulations.');
assert.strictEqual(governed.en.transport.air, 'Not classified as dangerous goods for air transport, in accordance with IATA regulations.');
assert.strictEqual(governed.en.transport.precautions, 'Not regulated as dangerous goods.');

console.log('✅ 3. governContext 核心管线通过');
console.log('🎉 所有 context-governor 单元断言 100% 验证通过！');
