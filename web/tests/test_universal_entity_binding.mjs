import { createWorkSession, applyCompanyPreset } from '../src/template-editor.js';
import { bindEntityPresetToDocument } from '../src/universal-editor-primitives.js';

async function runTests() {
  console.log('=== Test 1: Testing Universal Entity Preset Binding (Chinese) ===');
  const sessionCn = await createWorkSession({ templateKey: 'CN_Guanzhi', modelCode: 'WH-TEST' });

  const customWanhua = {
    id: 'preset_wanhua',
    name: '万华化学',
    language: 'CN',
    entityData: {
      name_zh: '万华化学集团股份有限公司',
      name_en: 'Wanhua Chemical Group Co., Ltd.',
      shortName_zh: '万华',
      shortName_en: 'Wanhua',
      address_zh: '山东省烟台市开发区重庆大街59号',
      address_en: 'No. 59 Chongqing Street, Yeda, Yantai, Shandong',
      tel: '86-535-3031999',
      fax: '86-535-3031998',
      emergencyTel_zh: '86-535-8203123',
      emergencyTel_en: '86-535-8203123'
    }
  };

  const resCn = applyCompanyPreset(sessionCn, customWanhua);
  console.log('Applied custom Wanhua preset:', resCn);
  if (!resCn.success || resCn.companyName !== '万华化学集团股份有限公司') {
    throw new Error('Test 1 failed: Company name not injected');
  }

  // Check Section 1 cells
  const s1 = (sessionCn.engine.records || []).find(r => r.sectionNumber === 1);
  const rowsText = s1.rows.map(r => `${r.cells[0]?.text || ''} -> ${r.cells[1]?.text || ''}`);
  console.log('Section 1 rows:\n', rowsText.join('\n'));

  const nameRow = s1.rows.find(r => /供应商名称|制造商/i.test(r.cells[0]?.text || ''));
  if (!nameRow || nameRow.cells[1]?.text !== '万华化学集团股份有限公司') {
    throw new Error('Test 1 failed: Supplier name cell did not match Wanhua');
  }

  const addrRow = s1.rows.find(r => /地址/i.test(r.cells[0]?.text || ''));
  if (!addrRow || addrRow.cells[1]?.text !== '山东省烟台市开发区重庆大街59号') {
    throw new Error('Test 1 failed: Address cell did not match Wanhua');
  }

  console.log('\n=== Test 2: Testing Universal Entity Preset Binding (English) ===');
  const sessionEn = await createWorkSession({ templateKey: 'EN_Guanzhi', modelCode: 'WH-TEST' });
  const resEn = applyCompanyPreset(sessionEn, customWanhua);
  console.log('Applied custom Wanhua preset (EN):', resEn);
  if (!resEn.success || resEn.companyName !== 'Wanhua Chemical Group Co., Ltd.') {
    throw new Error('Test 2 failed: English company name not injected');
  }

  const s1En = (sessionEn.engine.records || []).find(r => r.sectionNumber === 1);
  const rowsTextEn = s1En.rows.map(r => `${r.cells[0]?.text || ''} -> ${r.cells[1]?.text || ''}`);
  console.log('Section 1 EN rows:\n', rowsTextEn.join('\n'));

  const nameRowEn = s1En.rows.find(r => /Company\s*name|Manufacturer\b|Name\s*of\s*supplier/i.test(r.cells[0]?.text || ''));
  console.log('Section 1 EN Name row:', nameRowEn?.cells[0]?.text, '->', nameRowEn?.cells[1]?.text);
  if (!nameRowEn || nameRowEn.cells[1]?.text !== 'Wanhua Chemical Group Co., Ltd.') {
    throw new Error('Test 2 failed: English supplier name cell did not match Wanhua');
  }

  console.log('\n🏆 ALL UNIVERSAL ENTITY BINDING TESTS PASSED! Exit code 0.');
}

runTests().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
