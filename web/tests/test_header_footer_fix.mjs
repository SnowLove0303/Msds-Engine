import assert from 'node:assert';
import { createWorkSession } from '../src/template-editor.js';
import { updateHeaderFooterData } from '../src/docx-engine.js';
import { JSDOM } from 'jsdom';

console.log('=== Running test_header_footer_fix.mjs ===');

async function testHF(templateKey, entityId, isEnglish) {
  console.log(`\nTesting Header/Footer on ${templateKey} (${entityId}, isEn=${isEnglish})...`);
  const session = await createWorkSession(templateKey);

  const companyName = isEnglish
    ? (entityId.includes('GUOCAI') ? 'Yingde Guocai New Material Co., Ltd.' : 'Guangzhou Guanzhi New Material Technology Co., Ltd.')
    : (entityId.includes('GUOCAI') ? '英德市国彩新材料有限公司' : '广州冠志新材料科技有限公司');

  updateHeaderFooterData(session.engine, {
    model: 'HPU-7651',
    company: companyName,
    revisionDate: '2023/09/27',
    language: isEnglish ? 'EN' : 'CN',
    title: isEnglish ? 'MATERIAL SAFETY DATA SHEET' : '物料安全数据表',
    version: isEnglish ? 'Version: V1.0' : 'Version：V1.0'
  });

  for (const [partName, xml] of Object.entries(session.engine.supportingXml || {})) {
    if (!partName.includes('header') && !partName.includes('footer')) continue;
    console.log(`  Inspecting ${partName}...`);

    // 1. Zero PEA-4139 residue
    assert(!/PEA\s*-\s*4139/i.test(xml), `No PEA-4139 allowed in ${partName}!`);

    // 2. If English, zero Chinese characters in footer
    if (isEnglish && partName.includes('footer')) {
      const pureText = xml.replace(/<[^>]+>/g, ' ');
      const chineseChars = pureText.match(/[\u4e00-\u9fa5]/g) || [];
      assert.strictEqual(chineseChars.length, 0, `English footer must not have Chinese characters! Found: ${chineseChars.join(',')}`);
    }

    // 3. Inspect header1.xml elements
    if (partName === 'word/header1.xml') {
      assert(xml.includes('HPU-7651'), 'Header must contain HPU-7651');
      assert(xml.includes('w:sz w:val="36"'), 'Model box must have 18pt font size (sz=36)');
      assert(xml.includes('w:sz w:val="44"'), 'Title must have 22pt font size (sz=44)');
      assert(xml.includes('w:sz w:val="18"'), 'Version must have 9pt font size (sz=18)');
    }

    // 4. Inspect footer1.xml elements
    if (partName === 'word/footer1.xml') {
      assert(xml.includes('HPU-7651-MSDS'), 'Footer must contain HPU-7651-MSDS');
      assert(xml.includes(companyName), `Footer must contain company: ${companyName}`);
      assert(xml.includes('w:sz w:val="21"'), 'Company and model must have 10.5pt font size (sz=21)');
      assert(xml.includes('w:sz w:val="20"'), 'Date must have 10pt font size (sz=20)');
      assert(xml.includes('w:sz w:val="24"'), 'Dynamic page number must have 12pt font size (sz=24)');
      assert(xml.includes('PAGE') && xml.includes('NUMPAGES'), 'Dynamic PAGE and NUMPAGES fields must be preserved');
    }
  }

  console.log(`  ✓ ${templateKey} passed all header/footer checks!`);
}

async function main() {
  await testHF('CN_Guanzhi', 'GUANZHI', false);
  await testHF('CN_Guocai', 'GUOCAI', false);
  await testHF('EN_Guanzhi', 'GUANZHI', true);
  await testHF('EN_Guocai', 'GUOCAI', true);
  console.log('\n✅ ALL HEADER/FOOTER TESTS PASSED 100%!');
}

main().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
