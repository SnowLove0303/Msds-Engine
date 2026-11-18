import assert from 'node:assert/strict';
import {
  validateCasChecksum,
  verifyChemicalCasCoherence,
  auditSection3CasList,
  auditSection2HazardousCasCoherence,
  COMMON_CHEMICAL_CAS_MAP
} from '../src/cas-validator.js';

console.log('>>> [TEST] 开始执行 CAS 国际标准校验和与变异反欺诈单元测试套件...');

let totalAssertions = 0;
function check(condition, message) {
  totalAssertions++;
  assert.ok(condition, message);
}

// ==========================================
// 1. validateCasChecksum 正向合法 CAS 校验
// ==========================================
console.log('--- 测试 1: 正向合法标准 CAS 与商业秘密豁免项 ---');
const validCases = [
  { cas: '107-98-2', expectedCheck: 2 },
  { cas: '7732-18-5', expectedCheck: 5 },
  { cas: '5131-66-8', expectedCheck: 8 },
  { cas: '79-09-4', expectedCheck: 4 },
  { cas: '67-63-0', expectedCheck: 0 },
  { cas: '111-76-2', expectedCheck: 2 },
  { cas: '112-34-5', expectedCheck: 5 },
  { cas: '34590-94-8', expectedCheck: 8 },
  { cas: '28182-81-2', expectedCheck: 2 },
  { cas: '822-06-0', expectedCheck: 0 }
];

for (const tc of validCases) {
  const res = validateCasChecksum(tc.cas);
  check(res.valid === true, `CAS ${tc.cas} 应当校验通过`);
  check(res.isExempt === false, `CAS ${tc.cas} 不应为豁免项`);
  check(res.calculatedCheckDigit === tc.expectedCheck, `CAS ${tc.cas} 计算校验码应为 ${tc.expectedCheck}`);
}

const exemptCases = ['商业秘密', '商业机密', '保密', 'Trade secret', 'trade secret', 'Proprietary', '无', 'None', 'Not applicable', '/', '—', '-'];
for (const ex of exemptCases) {
  const res = validateCasChecksum(ex);
  check(res.valid === true, `豁免项 "${ex}" 应当校验通过`);
  check(res.isExempt === true, `豁免项 "${ex}" 应标记为 isExempt=true`);
}

// ==========================================
// 2. validateCasChecksum 变异反例与非法格式阻断
// ==========================================
console.log('--- 测试 2: 变异反例 (加权校验和错误) 与非法格式阻断 ---');
const mutationCases = [
  { cas: '107-98-3', expectedCalc: 2, declared: 3 },
  { cas: '7732-18-6', expectedCalc: 5, declared: 6 },
  { cas: '5131-66-0', expectedCalc: 8, declared: 0 },
  { cas: '79-09-9', expectedCalc: 4, declared: 9 }
];

for (const mc of mutationCases) {
  const res = validateCasChecksum(mc.cas);
  check(res.valid === false, `变异 CAS ${mc.cas} 必须阻断拦截失败`);
  check(res.isExempt === false, `变异 CAS ${mc.cas} 不应为豁免项`);
  check(res.calculatedCheckDigit === mc.expectedCalc, `变异 CAS ${mc.cas} 计算出的数学校验码必须为 ${mc.expectedCalc}`);
  check(res.declaredCheckDigit === mc.declared, `变异 CAS ${mc.cas} 声明的校验码应为 ${mc.declared}`);
  check(res.reason.includes('加权校验和不匹配'), `错误信息应指明校验和不匹配`);
}

const malformedCases = ['107982', '107-98-', '107-98-22', 'abc-def-g', '', '   ', null, undefined];
for (const mf of malformedCases) {
  const res = validateCasChecksum(mf);
  check(res.valid === false, `非法格式 "${mf}" 必须拦截`);
  check(res.isExempt === false, `非法格式 "${mf}" 不得豁免`);
}

// ==========================================
// 3. verifyChemicalCasCoherence 实体语义对账与防张冠李戴
// ==========================================
console.log('--- 测试 3: 化学品实体语义对账与张冠李戴防欺诈 ---');
// 正常匹配
const matchCases = [
  { name: '1-甲氧基-2-丙醇', cas: '107-98-2' },
  { name: '丙二醇甲醚', cas: '107-98-2' },
  { name: 'PGME', cas: '107-98-2' },
  { name: '1-methoxy-2-propanol', cas: '107-98-2' },
  { name: '水', cas: '7732-18-5' },
  { name: '去离子水', cas: '7732-18-5' },
  { name: '异丙醇', cas: '67-63-0' },
  { name: 'IPA', cas: '67-63-0' }
];

for (const m of matchCases) {
  const res = verifyChemicalCasCoherence(m.name, m.cas);
  check(res.coherent === true, `化学品 "${m.name}" 与 CAS ${m.cas} 应当一致`);
}

// 张冠李戴冲突 (例如名称为异丙醇，却填报了 1-甲氧基-2-丙醇的 CAS)
const fraudCases = [
  { name: '异丙醇', cas: '107-98-2' }, // 异丙醇是 67-63-0
  { name: '1-甲氧基-2-丙醇', cas: '67-63-0' }, // PGME 是 107-98-2
  { name: '水', cas: '107-98-2' },
  { name: '乙二醇单丁醚', cas: '7732-18-5' }
];

for (const fc of fraudCases) {
  const res = verifyChemicalCasCoherence(fc.name, fc.cas);
  check(res.coherent === false, `张冠李戴 "${fc.name}" -> ${fc.cas} 必须被识破并阻断`);
  check(res.reason.includes('重大实体错位警报'), `必须给出重大实体错位警报`);
}

// ==========================================
// 4. auditSection3CasList Section 3 全量法医级审计
// ==========================================
console.log('--- 测试 4: Section 3 组分列表全量法医级审计 ---');
const cleanS3 = [
  { name: '水', cas: '7732-18-5', conc: '40-50%' },
  { name: '1-甲氧基-2-丙醇', cas: '107-98-2', conc: '10-20%' },
  { name: '水性环氧树脂', cas: '商业机密', conc: '30-40%' }
];
const s3PassRes = auditSection3CasList(cleanS3);
check(s3PassRes.allValid === true, '纯净组分列表应当 100% 通过');
check(s3PassRes.passCount === 3, '通过数量应为 3');
check(s3PassRes.failCount === 0, '失败数量应为 0');

// 注入变异非法 CAS
const mutatedS3 = [
  { name: '水', cas: '7732-18-5', conc: '40-50%' },
  { name: '1-甲氧基-2-丙醇', cas: '107-98-3', conc: '10-20%' }, // 变异
  { name: '水性环氧树脂', cas: '商业机密', conc: '30-40%' }
];
const s3FailRes = auditSection3CasList(mutatedS3);
check(s3FailRes.allValid === false, '含有变异 CAS 的组分列表必须判定为失败');
check(s3FailRes.passCount === 2, '通过数量应为 2');
check(s3FailRes.failCount === 1, '失败数量应为 1');

// ==========================================
// 5. auditSection2HazardousCasCoherence Section 2 穿透 Section 3 闭环
// ==========================================
console.log('--- 测试 5: Section 2 标签有害成分穿透 Section 3 闭环 ---');
const s2ValidTextCn = `
2.2 标签要素
象形图：感叹号
信号词：警告
必须列在标签上的有害成分：1-甲氧基-2-丙醇
危险说明：H336 可引起昏睡或眩晕。
`;
const s2ValidRes = auditSection2HazardousCasCoherence(s2ValidTextCn, cleanS3);
check(s2ValidRes.coherent === true, 'CN 标签有害成分穿透应当成功');
check(s2ValidRes.matchedCas === '107-98-2', '匹配到的 CAS 必须是 107-98-2');

const s2ValidTextEn = `
2.2 Label elements
Signal word: Warning
Hazardous components which must be listed on the label: 1-Methoxy-2-propanol
Hazard statements: H336 May cause drowsiness or dizziness.
`;
const s2ValidEnRes = auditSection2HazardousCasCoherence(s2ValidTextEn, cleanS3);
check(s2ValidEnRes.coherent === true, 'EN 标签有害成分穿透应当成功');

// Section 2 虚增或遗漏（在 S3 找不到）
const s2MissingText = `
2.2 标签要素
必须列在标签上的有害成分：异丙醇
`;
const s2MissingRes = auditSection2HazardousCasCoherence(s2MissingText, cleanS3);
check(s2MissingRes.coherent === false, 'S2 声明的异丙醇在 S3 缺失，必须报错');
check(s2MissingRes.reason.includes('未在 Section 3 组分表中列出'), '错误信息必须提示未列出');

console.log(`\n======================================================`);
console.log(`>>> [TEST SUCCESS] 全部 ${totalAssertions} 个 CAS 单元与变异反欺诈断言 100% 验证通过！`);
console.log(`======================================================\n`);
