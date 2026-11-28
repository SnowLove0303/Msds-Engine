import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import JSZip from 'jszip';
import { JSDOM } from 'jsdom';
import { recognizeTemplateTopology, buildTemplateProfile } from '../src/template-topology-recognizer.js';
import { compileTopologyOps, normalizeTemplateSections } from '../src/topology-matcher.js';

const dom = new JSDOM('<!doctype html><html><body></body></html>');
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function buildSynthetic5SectionDocx() {
  const zip = new JSZip();
  const makeCell = (text, w = 4500) => `<w:tc><w:tcPr><w:tcW w:w="${w}" w:type="dxa"/></w:tcPr><w:p><w:r><w:t>${text}</w:t></w:r></w:p></w:tc>`;
  const makeRow = (cells) => `<w:tr>${cells.join('')}</w:tr>`;
  const makeTbl = (rows) => `<w:tbl><w:tblPr><w:tblBorders><w:top w:val="single"/><w:bottom w:val="single"/></w:tblBorders></w:tblPr>${rows.join('')}</w:tbl>`;

  const tbl1 = makeTbl([
    makeRow([makeCell('第 1 部分 化学品及企业标识', 9000)]),
    makeRow([makeCell('1.1 产品名称：'), makeCell('')])
  ]);
  const tbl2 = makeTbl([
    makeRow([makeCell('第 2 部分 危险性概述', 9000)]),
    makeRow([makeCell('占位说明', 9000)])
  ]);
  const tbl3 = makeTbl([
    makeRow([makeCell('第 3 部分 成分/组成信息', 9000)]),
    makeRow([makeCell('化学品名称', 3000), makeCell('CAS编号', 3000), makeCell('含量', 3000)]),
    makeRow([makeCell('', 3000), makeCell('', 3000), makeCell('', 3000)])
  ]);
  const tbl4 = makeTbl([
    makeRow([makeCell('第 4 部分 急救措施', 9000)]),
    makeRow([makeCell('吸入：'), makeCell('')])
  ]);
  const tbl5 = makeTbl([
    makeRow([makeCell('第 5 部分 通用通栏大纲扩展节', 9000)]),
    makeRow([makeCell('大纲占位', 9000)])
  ]);

  const docXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    ${tbl1}${tbl2}${tbl3}${tbl4}${tbl5}
    <w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1440" w:bottom="1440" w:left="1440" w:right="1440"/></w:sectPr>
  </w:body>
</w:document>`;

  zip.file('word/document.xml', docXml);
  return zip.generateAsync({ type: 'nodebuffer' });
}

// 1. 测试非 16 章节（5 章节）自定义模板动态识别与能力分类
{
  const buf = await buildSynthetic5SectionDocx();
  const blueprint = await recognizeTemplateTopology(buf, { templateKey: 'CUSTOM_5_SEC' });
  assert.equal(blueprint.sectionsCount, 5);
  assert.equal(blueprint.sections[0].layoutType, 'KV_TWO_COL');
  assert.equal(blueprint.sections[1].layoutType, 'FULL_WIDTH_OUTLINE');
  assert.equal(blueprint.sections[2].layoutType, 'MULTI_COL_GRID');
  assert.equal(blueprint.sections[4].layoutType, 'FULL_WIDTH_OUTLINE');

  const profile = buildTemplateProfile(blueprint);
  assert.equal(profile.sectionsCount, 5);
  assert.equal(profile.sections[4].capabilities.isFullWidthOutline, true);
  console.log('✅ PASS: 5 章节自定义模板动态识别与 Template Profile 导出通过');

  // 2. 测试能力驱动编译（无需 1..16 齐全，且第 5 节按 FULL_WIDTH_OUTLINE 编译）
  const mockCtx2 = {
    modelCode: 'CUSTOM-5',
    validation: { isValid: true },
    sections: {
      1: { items: [{ role: 'SEQ_LABEL', seq: '1.1', labelCn: '产品名称：', valueCn: 'CUSTOM-5', placement: { gridType: '2_COL_KV' } }] },
      2: { items: [{ role: 'FULL_WIDTH_STRUCTURED', lines: [{ textCn: '非危险品' }] }] },
      3: { items: [{ role: 'COMPONENT_ROW', cellsCn: ['水', '7732-18-5', '100%'] }] },
      4: { items: [{ role: 'SUB_LABEL', labelCn: '吸入：', valueCn: '移至空气新鲜处。', placement: { gridType: '2_COL_KV' } }] },
      5: { items: [{ role: 'FULL_WIDTH_STRUCTURED', lines: [{ textCn: '自定义第5节通栏内容' }] }] }
    }
  };
  const compiled = compileTopologyOps(mockCtx2, blueprint, { language: 'zh' });
  assert.equal(compiled.stats.sectionsMatched, 5);
  assert.equal(compiled.sectionPlans.find(p => p.sectionNumber === 5)?.strategy, 'FULL_WIDTH_OUTLINE');
  assert.ok(compiled.operations.some(op => op.op === 'writeFullWidth' && op.sectionNumber === 5));
  console.log('✅ PASS: 非 16 章节模板能力驱动编译通过 (sectionsMatched=5)');
}

// 3. 回归测试：官方 16 章节母版 100% 兼容
{
  const tplPath = path.resolve(__dirname, '../public/templates/正式模板_MSDS_CN_冠志(1).docx');
  const blueprint = await recognizeTemplateTopology(tplPath);
  assert.equal(blueprint.sectionsCount, 16);
  const normalized = normalizeTemplateSections(blueprint);
  assert.equal(normalized.length, 16);
  console.log('✅ PASS: 官方 16 章节母版向后兼容回归通过');
}
