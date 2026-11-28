import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import JSZip from 'jszip';
import { CHEMICAL_TRANSLATION_DICT, loadBaseTranslationDict } from '../src/context-governor.js';
import { auditPhase1Context1, auditPhase2Context2 } from '../src/staged-mechanical-audit.js';

// 1. 外置词库加载与只读冻结校验
{
  const loaded = loadBaseTranslationDict();
  assert.ok(Object.keys(loaded).length >= 190, '外置词库应包含全部基准词条');
  assert.equal(Object.isFrozen(CHEMICAL_TRANSLATION_DICT), true, 'CHEMICAL_TRANSLATION_DICT 应保持冻结向后兼容');
  assert.equal(CHEMICAL_TRANSLATION_DICT['水'], 'Water');
  console.log('✅ PASS: base-translation-dict.json 外置加载与冻结兼容校验通过');
}

// 2. 参数化机械审计：5 章节自定义 templateProfile 应通过 Phase 1 & Phase 2
{
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'msds-param-audit-'));
  const zip = new JSZip();
  zip.file('word/document.xml', '<w:document/>');
  const srcPath = path.join(tmpDir, 'custom5.docx');
  fs.writeFileSync(srcPath, await zip.generateAsync({ type: 'nodebuffer' }));

  const templateProfile = {
    templateKey: 'CUSTOM_5',
    sections: [1, 2, 3, 4, 5].map(n => ({ sectionNumber: n }))
  };
  const context1 = { sections: { 1: {}, 2: {}, 3: {}, 4: {}, 5: {} } };
  const p1Ok = await auditPhase1Context1({ sourcePath: srcPath, context1, templateProfile });
  assert.equal(p1Ok.ok, true, `预期 5 章节模板通过 Phase 1: ${JSON.stringify(p1Ok.findings)}`);

  const p1Fail = await auditPhase1Context1({
    sourcePath: srcPath,
    context1: { sections: { 1: {}, 2: {}, 3: {}, 4: {} } },
    templateProfile
  });
  assert.equal(p1Fail.ok, false);
  assert.ok(p1Fail.findings.some(f => f.measuredDetail.includes('5')));

  const context2 = {
    validation: { isValid: true, untranslatedCount: 0, numericMismatchCount: 0 },
    sections: {
      1: { items: [{ labelCn: '产品名称：', labelEn: 'Product name:', valueCn: 'A', valueEn: 'A' }] },
      5: { items: [{ textCn: '说明', textEn: 'Note.' }] }
    }
  };
  const p2Ok = auditPhase2Context2({ context2, templateProfile });
  assert.equal(p2Ok.ok, true, `预期 5 章节模板通过 Phase 2: ${JSON.stringify(p2Ok.findings)}`);

  fs.rmSync(tmpDir, { recursive: true, force: true });
  console.log('✅ PASS: templateProfile 参数化 Phase 1 & Phase 2 机械审计通过');
}
