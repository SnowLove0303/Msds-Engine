import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import JSZip from 'jszip';
import { JSDOM } from 'jsdom';
import { recognizeTemplateTopology, buildTemplateProfile } from '../src/template-topology-recognizer.js';
import { createWorkSession, saveSession, applyAdaptiveRuler, writeCellValueToSession } from '../src/template-editor.js';
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
  // 1. 验证愿景核心文案包含“拓扑即参数”
  assert.ok(SYSTEM_VISION_CORE.universalityPrinciples.some(p => p.includes('拓扑即参数')));

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

  // 3. 参数化编辑器按提取出的 profile 渲染（不强加 420/560 dxa 或 宋体/Arial）
  const session = await createWorkSession({ templateKey: tplPath, workingDir: tmpDir, modelCode: 'ACME-6' });
  session.templateProfile = { ...session.templateProfile, typographyProfile: profile.typographyProfile };
  writeCellValueToSession(session, { sectionNumber: 1, rowIndex: 1, cellIndex: 1, text: 'ACME-6' });
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
} finally {
  fs.rmSync(tmpDir, { recursive: true, force: true });
}
