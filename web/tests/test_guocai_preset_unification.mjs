import assert from 'node:assert';
import { BUILTIN_COMPANY_PRESETS } from '../src/msds-db.js';

console.log('Testing Task 1 (REQ-01) Guocai Presets Unification...');

const guocaiCn = BUILTIN_COMPANY_PRESETS.find(p => p.id === 'preset_guocai_cn');
const guocaiEn = BUILTIN_COMPANY_PRESETS.find(p => p.id === 'preset_guocai_en');

assert(guocaiCn, 'preset_guocai_cn must exist');
assert(guocaiEn, 'preset_guocai_en must exist');

// Check CN
assert.strictEqual(guocaiCn.entityData.name_zh, '英德市国彩精细化工有限公司');
assert.strictEqual(guocaiCn.entityData.name_en, 'Yingde Guocai Fine Chemical Co., Ltd.');
assert.strictEqual(guocaiCn.headerFooterOverrides.company, '英德市国彩精细化工有限公司');
assert.strictEqual(guocaiCn.fieldOverrides.supplier_name, '英德市国彩精细化工有限公司');

// Check EN
assert.strictEqual(guocaiEn.entityData.name_zh, '英德市国彩精细化工有限公司');
assert.strictEqual(guocaiEn.entityData.name_en, 'Yingde Guocai Fine Chemical Co., Ltd.');
assert.strictEqual(guocaiEn.headerFooterOverrides.company, 'Yingde Guocai Fine Chemical Co., Ltd.');
assert.strictEqual(guocaiEn.fieldOverrides.supplier_name, 'Yingde Guocai Fine Chemical Co., Ltd.');

console.log('✅ Task 1 (REQ-01) PASS: Guocai presets are 100% unified to 英德市国彩精细化工有限公司 / Yingde Guocai Fine Chemical Co., Ltd.!');
