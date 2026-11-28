import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import JSZip from 'jszip';
import { JSDOM } from 'jsdom';
import { recognizeTemplateTopology, buildTemplateProfile } from '../src/template-topology-recognizer.js';
import { compileTopologyOps } from '../src/topology-matcher.js';
import { createWorkSession, saveSession, applyAdaptiveRuler, writeCellValueToSession, applyRoleStylePrototype } from '../src/template-editor.js';
import { applyGlobalTypographyProjection } from '../src/universal-editor-primitives.js';
import { auditPhase1Context1, auditPhase5DocxFiles } from '../src/staged-mechanical-audit.js';
import { SYSTEM_VISION_CORE } from '../src/system-vision.js';

const dom = new JSDOM('<!doctype html><html><body></body></html>');
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

async function buildCustom6SectionTemplateDocx(filePath) {
  const zip = new JSZip();
  const makeCell = (text, w = 4500, indentDxa = 360) => `<w:tc><w:tcPr><w:tcW w:w="${w}" w:type="dxa"/></w:tcPr><w:p><w:pPr><w:ind w:left="${indentDxa}" w:hanging="${indentDxa}"/></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Calibri" w:eastAsia="Calibri"/><w:sz w:val="20"/></w:rPr><w:t>${text}</w:t></w:r></w:p></w:tc>`;
  const makeRow = (cells) => `<w:tr>${cells.join('')}</w:tr>`;
  const makeTbl = (rows) => `<w:tbl><w:tblPr><w:tblBorders><w:top w:val="single"/><w:bottom w:val="single"/></w:tblBorders></w:tblPr>${rows.join('')}</w:tbl>`;

  const tbl1 = makeTbl([makeRow([makeCell('1. Product Info', 9000, 0)]), makeRow([makeCell('1.1 Product name:', 4500, 360), makeCell('', 4500, 0)])]);
  const tbl2 = makeTbl([makeRow([makeCell('2. Composition', 9000, 0)]), makeRow([makeCell('Component', 3000, 0), makeCell('CAS', 3000, 0), makeCell('%', 3000, 0)]), makeRow([makeCell('', 3000, 0), makeCell('', 3000, 0), makeCell('', 3000, 0)])]);
  const tbl3 = makeTbl([makeRow([makeCell('3. First Aid', 9000, 0)]), makeRow([makeCell('3.1.1.1 Inhalation:', 4500, 720), makeCell('', 4500, 0)])]);
  const tbl4 = makeTbl([makeRow([makeCell('4. Custom Outline Section', 9000, 0)]), makeRow([makeCell('Placeholder outline', 9000, 360)])]);
  const tbl5 = makeTbl([makeRow([makeCell('5. Storage', 9000, 0)]), makeRow([makeCell('5.1 Conditions:', 4500, 360), makeCell('', 4500, 0)])]);
  const tbl6 = makeTbl([makeRow([makeCell('6. Other', 9000, 0)]), makeRow([makeCell('6.1 Note:', 4500, 360), makeCell('', 4500, 0)])]);

  const docXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    ${tbl1}${tbl2}${tbl3}${tbl4}${tbl5}${tbl6}
    <w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1440" w:bottom="1440" w:left="1440" w:right="1440"/></w:sectPr>
  </w:body>
</w:document>`;
  zip.file('word/document.xml', docXml);
  const buf = await zip.generateAsync({ type: 'nodebuffer' });
  fs.writeFileSync(filePath, buf);
  return buf;
}

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'msds-zero-hc-'));
try {
  // 1. 验证愿景核心文案包含“拓扑即参数”，且 template-topology-recognizer.js 零内容硬编码
  assert.ok(SYSTEM_VISION_CORE.universalityPrinciples.some(p => p.includes('拓扑即参数')));
  const recognizerSrc = fs.readFileSync(new URL('../src/template-topology-recognizer.js', import.meta.url), 'utf8');
  assert.ok(!recognizerSrc.includes('SEMANTIC_KEY_MAP'), '拓扑识别层严禁包含模板内容词典 SEMANTIC_KEY_MAP');
  assert.ok(!recognizerSrc.includes('STANDARD_TEMPLATES'), '拓扑识别层严禁写死 STANDARD_TEMPLATES');
  assert.ok(!/冠志|国彩/.test(recognizerSrc), '拓扑识别层严禁包含任何特定企业用户数据');

  // 2. 构建完全异构的 6 章节模板 (Calibri 10pt, 360/720 dxa, 第 4 节为通栏大纲)
  const tplPath = path.join(tmpDir, 'custom_6sec_EN.docx');
  await buildCustom6SectionTemplateDocx(tplPath);

  const blueprint = await recognizeTemplateTopology(tplPath, { templateKey: 'CUSTOM_6' });
  const profile = buildTemplateProfile(blueprint);
  assert.equal(profile.sectionsCount, 6);
  assert.equal(profile.sections[3].layoutType, 'FULL_WIDTH_OUTLINE', '第 4 节应被动态识别为通栏大纲');
  assert.equal(profile.typographyProfile.fontFamily, 'Calibri');
  assert.equal(profile.typographyProfile.valueFontSize, '20');
  assert.deepEqual(profile.typographyProfile.tabStops, { tierA: 360, tierB: 720 });
  console.log('✅ PASS: 拓扑识别成功从异构模板提取 6 章节、Calibri 10pt 与 360/720 dxa 参数');

  // 3. 参数化编辑器按提取出的 profile 与 stylePrototypes 复用渲染
  const session = await createWorkSession({ templateKey: tplPath, workingDir: tmpDir, modelCode: 'ACME-6' });
  session.templateProfile = {
    ...session.templateProfile,
    typographyProfile: profile.typographyProfile,
    stylePrototypes: profile.stylePrototypes
  };
  writeCellValueToSession(session, { sectionNumber: 1, rowIndex: 1, cellIndex: 1, text: 'ACME-6' });
  const protoApplied = applyRoleStylePrototype(session, { sectionNumber: 1, rowIndex: 1, cellIndex: 1, role: 'VALUE' });
  assert.equal(protoApplied.applied, true, '编辑器应成功复用模板提取的 VALUE 样式原型');
  applyAdaptiveRuler(session, 1);
  applyAdaptiveRuler(session, 3);
  applyGlobalTypographyProjection(session.engine, true, profile.typographyProfile);

  const outFile = 'ACME-6 msds_EN Acme.docx';
  const outPath = path.join(tmpDir, outFile);
  await saveSession(session, outPath);

  // 验证标尺确实使用了模板提取的 360 / 720 dxa，而非写死的 420 / 560 dxa
  const outZip = await JSZip.loadAsync(fs.readFileSync(outPath));
  const outXml = await outZip.file('word/document.xml').async('string');
  assert.ok(outXml.includes('w:left="360"'), '应继承模板 360 dxa');
  assert.ok(outXml.includes('w:left="720"'), '多位数序号应升级为模板 720 dxa');
  assert.ok(!outXml.includes('w:left="420"'), '严禁强行注入硬编码的 420 dxa');
  console.log('✅ PASS: 编辑器完全按 Template Profile (360/720 dxa) 参数化渲染');

  // 4. 参数化审计：6 章节 + 单份自定义 DOCX 交付物 -> 全部通过，不锁死 8 格式或 16 节
  const mockCtx1 = { sections: { 1: {}, 2: {}, 3: {}, 4: {}, 5: {}, 6: {} } };
  const p1 = await auditPhase1Context1({ sourcePath: tplPath, context1: mockCtx1, templateProfile: profile });
  assert.equal(p1.ok, true, `Phase 1 应通过: ${JSON.stringify(p1.findings)}`);

  const p5 = await auditPhase5DocxFiles({
    targetDir: tmpDir,
    modelCode: 'ACME-6',
    templateProfile: profile,
    expectedDeliverables: [{ key: 'Acme_en', lang: 'en', company: 'Acme', file: outFile }]
  });
  const criticalOrFail = p5.findings.filter(f => f.severity === 'CRITICAL' && f.ruleId === 'P5_DOCX_EXISTS');
  assert.equal(criticalOrFail.length, 0, '自定义单交付物不应触发 8 格式缺失报错');
  console.log('✅ PASS: 参数化机械审计支持 6 章节与自定义单交付物');
  // 5. 不标准/混杂模板测试：styles.xml docDefaults + 外部段落标题 + 4列交错KV + 众数选举 + 页眉页脚纯结构插槽
  {
    const messyZip = new JSZip();
    messyZip.file('word/styles.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Georgia" w:eastAsia="Georgia"/><w:sz w:val="22"/></w:rPr></w:rPrDefault></w:docDefaults>
</w:styles>`);
    messyZip.file('word/header1.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:hdr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:p><w:pPr><w:jc w:val="right"/></w:pPr><w:r><w:t>Acme Header</w:t></w:r></w:p></w:hdr>`);
    messyZip.file('word/footer1.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:ftr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:p><w:fldSimple w:instr="PAGE"/></w:p></w:ftr>`);
    const mkTc = (txt, bold, sz, ind) => `<w:tc><w:tcPr><w:tcW w:w="2250" w:type="dxa"/></w:tcPr><w:p><w:pPr>${ind ? `<w:ind w:left="${ind}" w:hanging="${ind}"/>` : ''}</w:pPr><w:r><w:rPr>${bold ? '<w:b/>' : ''}${sz ? `<w:sz w:val="${sz}"/>` : ''}</w:rPr><w:t>${txt}</w:t></w:r></w:p></w:tc>`;
    messyZip.file('word/document.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr><w:r><w:rPr><w:b/></w:rPr><w:t>1. External Heading</w:t></w:r></w:p>
    <w:tbl>
      <w:tr>${mkTc('A:', true, null, 300)}${mkTc('v1', false, null, 0)}${mkTc('B:', true, null, 300)}${mkTc('v2', false, null, 0)}</w:tr>
      <w:tr>${mkTc('C:', true, null, 300)}${mkTc('v3', false, '28', 0)}${mkTc('D:', true, null, 600)}${mkTc('v4', false, null, 0)}</w:tr>
    </w:tbl>
    <w:sectPr><w:pgSz w:w="11906" w:h="16838"/></w:sectPr>
  </w:body>
</w:document>`);
    const messyBuf = await messyZip.generateAsync({ type: 'nodebuffer' });
    const messyBp = await recognizeTemplateTopology(messyBuf, { templateKey: 'MESSY_TPL' });
    assert.equal(messyBp.sectionsCount, 1);
    assert.equal(messyBp.sections[0].hasExternalTitle, true, '应识别表外段落标题');
    assert.equal(messyBp.docDefaults.font, 'Georgia', '应从 styles.xml 读取 docDefaults 字体');
    assert.equal(messyBp.stylePrototypes.VALUE.sz, '22', '不标准模板 VALUE 字号应按众数选举为 22 (3次 vs 1次 28)');
    assert.deepEqual(messyBp.typographyProfile.tiers, [300, 600], '应按实测缩进提取 tiers=[300, 600]');
    assert.equal(messyBp.headerFooterTopology.headers[0].slots[0].align, 'right');
    assert.equal(messyBp.headerFooterTopology.footers[0].slots[0].slotRole, 'PAGE_NUMBER_FIELD');
    assert.equal('templateText' in messyBp.headerFooterTopology.headers[0].slots[0], false, '页眉页脚槽位严禁泄漏模板文本');
    console.log('✅ PASS: 不标准模板众数选举、表外标题、4列交错KV与纯结构页眉页脚通过');
  }

  // 6. 能力驱动 compileTopologyOps 对 6 节异构模板（第4节通栏）编译通过
  {
    const mockCtx2 = {
      modelCode: 'ACME-6',
      validation: { isValid: true },
      sections: {
        1: { items: [{ role: 'SEQ_LABEL', seq: '1.1', labelEn: 'Product name:', valueEn: 'ACME-6', placement: { gridType: '2_COL_KV' } }] },
        2: { items: [{ role: 'COMPONENT_ROW', cellsEn: ['Water', '7732-18-5', '100%'] }] },
        3: { items: [{ role: 'SEQ_LABEL', seq: '3.1.1.1', labelEn: 'Inhalation:', valueEn: 'Fresh air.', placement: { gridType: '2_COL_KV' } }] },
        4: { items: [{ role: 'FULL_WIDTH_STRUCTURED', lines: [{ textEn: 'Outline text in S4' }] }] },
        5: { items: [{ role: 'SEQ_LABEL', seq: '5.1', labelEn: 'Conditions:', valueEn: 'Cool place.', placement: { gridType: '2_COL_KV' } }] },
        6: { items: [{ role: 'SEQ_LABEL', seq: '6.1', labelEn: 'Note:', valueEn: 'None.', placement: { gridType: '2_COL_KV' } }] }
      }
    };
    const compiled = compileTopologyOps(mockCtx2, blueprint, { language: 'en' });
    assert.equal(compiled.stats.sectionsMatched, 6);
    assert.equal(compiled.sectionPlans.find(p => p.sectionNumber === 4)?.strategy, 'FULL_WIDTH_OUTLINE');
    console.log('✅ PASS: 能力驱动 compileTopologyOps 成功编译 6 节异构模板');
  }
} finally {
  fs.rmSync(tmpDir, { recursive: true, force: true });
}
