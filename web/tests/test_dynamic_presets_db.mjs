import {
  getDb,
  seedDefaultPresets,
  listPresets,
  getPresetById,
  getDefaultPreset,
  setDefaultPreset,
  savePreset,
  deletePreset
} from '../src/msds-db.js';

console.log('=== Test 1: Testing DB Initialization and Seed Default Presets ===');
const db = getDb();
seedDefaultPresets(db);

const allPresets = listPresets();
console.log(`Total presets loaded: ${allPresets.length}`);
if (allPresets.length < 2) {
  throw new Error(`Expected at least 2 presets, got ${allPresets.length}`);
}

const defaultCn = getDefaultPreset('CN');
console.log('Default CN Preset:', defaultCn.name, 'isDefault:', defaultCn.isDefault);
if (!defaultCn || !defaultCn.isDefault) {
  throw new Error('Default CN preset not found or isDefault is false');
}
if (!defaultCn.entityData || !defaultCn.entityData.name_zh) {
  throw new Error('Default CN preset missing entityData.name_zh');
}

console.log('\n=== Test 2: Creating New Custom Entity Preset (Wanhua Chemical) ===');
const wanhuaPreset = savePreset({
  id: 'preset_wanhua_test',
  name: '万华化学（测试预设）',
  language: 'CN',
  entity: '万华',
  isDefault: false,
  entityData: {
    name_zh: '万华化学集团股份有限公司',
    name_en: 'Wanhua Chemical Group Co., Ltd.',
    shortName_zh: '万华',
    shortName_en: 'Wanhua',
    creditCode: '91370600267139263L',
    address_zh: '山东省烟台市开发区重庆大街59号',
    address_en: 'No. 59 Chongqing Street, Yeda, Yantai, Shandong',
    tel: '86-535-3031999',
    fax: '86-535-3031998',
    emergencyTel_zh: '86-535-8203123',
    emergencyTel_en: '86-535-8203123'
  }
});

console.log('Saved custom preset:', wanhuaPreset.id, wanhuaPreset.name);
if (wanhuaPreset.entityData.shortName_zh !== '万华') {
  throw new Error('Custom preset entityData mismatch');
}

console.log('\n=== Test 3: Setting Custom Preset as Default ===');
const updatedWanhua = setDefaultPreset('preset_wanhua_test');
console.log('Wanhua isDefault now:', updatedWanhua.isDefault);
if (!updatedWanhua.isDefault) {
  throw new Error('Wanhua was not set to default');
}

const currentDefaultCn = getDefaultPreset('CN');
console.log('Current default CN is now:', currentDefaultCn.id, currentDefaultCn.name);
if (currentDefaultCn.id !== 'preset_wanhua_test') {
  throw new Error('Current default CN should be Wanhua');
}

// Reset default back to Guanzhi
setDefaultPreset('preset_guanzhi_cn');
console.log('Restored default CN back to Guanzhi');

console.log('\n=== Test 4: Deleting Custom Preset ===');
const delRes = deletePreset('preset_wanhua_test');
console.log('Delete result:', delRes);
const afterDel = getPresetById('preset_wanhua_test');
if (afterDel !== null) {
  throw new Error('Custom preset should have been deleted');
}

console.log('\n=== Test 5: Verify Builtin Preset Delete Protection ===');
let threw = false;
try {
  deletePreset('preset_guanzhi_cn');
} catch (e) {
  threw = true;
  console.log('Caught expected error when deleting builtin preset:', e.message);
}
if (!threw) {
  throw new Error('Builtin preset should not be deletable');
}

console.log('\n🏆 ALL PRESET DB TESTS PASSED! Exit code 0.');
