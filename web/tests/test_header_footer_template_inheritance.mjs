import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { JSDOM } from 'jsdom';

if (!globalThis.DOMParser || !globalThis.XMLSerializer) {
  const dom = new JSDOM('<!doctype html><html><body></body></html>');
  globalThis.DOMParser = dom.window.DOMParser;
  globalThis.XMLSerializer = dom.window.XMLSerializer;
}

import { loadDocx, updateHeaderFooterData, W_NS } from '../src/docx-engine.js';
import { applyGlobalTypographyProjection } from '../src/universal-editor-primitives.js';

async function testHeaderFooterInheritance() {
  console.log('Testing Header/Footer Template Inheritance...');

  const tplCnPath = 'web/public/templates/正式模板_MSDS_CN_冠志(1).docx';
  const tplEnPath = 'web/public/templates/正式模板_MSDS_EN_冠志(1).docx';

  for (const tplPath of [tplCnPath, tplEnPath]) {
    const isEn = tplPath.includes('_EN_');
    const buf = fs.readFileSync(tplPath);
    const engine = await loadDocx(buf);

    // 1. 模拟业务层更新页眉页脚
    updateHeaderFooterData(engine, {
      model: 'HPU-7651',
      company: isEn ? 'Guangzhou Guanzhi New Material Technology Co., Ltd.' : '广州冠志新材料科技有限公司',
      revisionDate: '2026年11月13日',
      version: 'V1.0',
      title: isEn ? 'MATERIAL SAFETY DATA SHEET' : '物料安全数据表',
      language: isEn ? 'en' : 'zh-CN'
    });

    // 2. 执行全文档全局排版投影 (applyGlobalTypographyProjection)
    applyGlobalTypographyProjection(engine, isEn);

    // 3. 校验 Header XML 属性
    const headerXml = engine.supportingXml['word/header1.xml'];
    assert(headerXml, 'header1.xml must exist');

    const domParser = new DOMParser();
    const hdrDoc = domParser.parseFromString(headerXml, 'application/xml');

    // 验证大标题：必须为 22pt (sz="44") 且 加粗 (w:b)
    const p0 = hdrDoc.getElementsByTagNameNS(W_NS, 'p')[0];
    const r0 = p0.getElementsByTagNameNS(W_NS, 'r')[0];
    const rPr0 = r0.getElementsByTagNameNS(W_NS, 'rPr')[0];
    const szVal = rPr0?.getElementsByTagNameNS(W_NS, 'sz')[0]?.getAttribute('w:val');
    const bVal = rPr0?.getElementsByTagNameNS(W_NS, 'b')[0];
    assert.strictEqual(szVal, '44', `Header title run in ${path.basename(tplPath)} MUST have sz="44" (22pt)! Got: ${szVal}`);
    assert(bVal, `Header title run in ${path.basename(tplPath)} MUST have <w:b/>!`);

    // 验证版本号：9pt (sz="18")
    const p1 = hdrDoc.getElementsByTagNameNS(W_NS, 'p')[1];
    const r1 = p1.getElementsByTagNameNS(W_NS, 'r')[0];
    const rPr1 = r1.getElementsByTagNameNS(W_NS, 'rPr')[0];
    const szVal1 = rPr1?.getElementsByTagNameNS(W_NS, 'sz')[0]?.getAttribute('w:val');
    assert.strictEqual(szVal1, '18', `Header version run in ${path.basename(tplPath)} MUST have sz="18" (9pt)! Got: ${szVal1}`);

    // 验证型号框：必须包含 HPU-7651, 18pt (sz="36"), 灰底 (D9D9D9)
    assert(headerXml.includes('HPU-7651'), 'Header table must contain HPU-7651');
    assert(headerXml.includes('w:val="36"') || headerXml.includes('sz="36"'), 'Header model must maintain 18pt (sz="36")');
    assert(headerXml.includes('D9D9D9'), 'Header model cell must maintain D9D9D9 shading');

    // 4. 校验 Footer XML 属性
    const footerXml = engine.supportingXml['word/footer1.xml'];
    assert(footerXml, 'footer1.xml must exist');

    // 验证公司与型号：必须包含 HPU-7651-MSDS, 10.5pt (sz="21")
    assert(footerXml.includes('HPU-7651-MSDS'), 'Footer must contain HPU-7651-MSDS');
    assert(footerXml.includes('w:val="21"') || footerXml.includes('sz="21"'), 'Footer company/model must maintain 10.5pt (sz="21")');

    // 验证动态页码域：必须完整保留 PAGE 与 NUMPAGES
    assert(footerXml.includes('PAGE'), 'Footer must retain dynamic PAGE field');
    assert(footerXml.includes('NUMPAGES'), 'Footer must retain dynamic NUMPAGES field');

    console.log(`✓ Template ${path.basename(tplPath)} Header/Footer inheritance verified successfully.`);
  }

  console.log('ALL HEADER/FOOTER INHERITANCE TESTS PASSED!');
}

testHeaderFooterInheritance().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
