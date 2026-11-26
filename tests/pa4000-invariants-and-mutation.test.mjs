import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { recognizeSourceDocx } from '../web/src/recognition-engine.js';
import { buildStructuredContext2 } from '../web/src/context-governor.js';
import { auditPhase2Context2 } from '../web/src/staged-mechanical-audit.js';

const PA4000_SRC = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料/2-2 水性羟基丙烯酸乳液 PA RA/PA-4000/PA-4000 msds_CN 冠志.docx';

test('translation-memory.json must not contain inverted S8 keys (8.1控制参数 / 8.2暴露控制)', () => {
  const tm = JSON.parse(fs.readFileSync(new URL('../web/src/translation-memory.json', import.meta.url), 'utf8'));
  assert.equal(Object.hasOwn(tm, '8.1控制参数'), false);
  assert.equal(Object.hasOwn(tm, '8.1控制参数：'), false);
  assert.equal(Object.hasOwn(tm, '8.2暴露控制'), false);
  assert.equal(Object.hasOwn(tm, '8.2暴露控制：'), false);
});

test('PA-4000 Context 2 enforces S2 GHS pictogram retention, S8 canonical order, /°C unit suffix, and EN spacing', async () => {
  const ctx1 = await recognizeSourceDocx(PA4000_SRC);
  const ctx2 = buildStructuredContext2(ctx1, {
    translations: {
      '粘合剂、涂料': 'Adhesives, coatings',
      '根据GHS不属于危险物': 'Not classified as a hazardous chemical according to GHS.',
      '皮肤接触不致敏': 'Not sensitizing in contact with skin.'
    }
  });

  // 1. S2 retains GHS象形图： and GHS Pictograms:
  const s2Lines = ctx2.sections[2].items.flatMap(it => it.lines || []);
  assert.ok(s2Lines.some(l => /^GHS象形图：$/i.test(l.textCn)), 'S2 CN must retain GHS象形图：');
  assert.ok(s2Lines.some(l => /^GHS Pictograms:$/i.test(l.textEn)), 'S2 EN must retain GHS Pictograms:');

  // 2. S8 canonical order: 8.1 Exposure controls -> 8.2 Control parameters
  const s8Items = ctx2.sections[8].items;
  const idx81 = s8Items.findIndex(it => it.seq === '8.1');
  const idx82 = s8Items.findIndex(it => it.seq === '8.2');
  assert.ok(idx81 >= 0 && idx82 >= 0 && idx81 < idx82, `S8 must have 8.1 before 8.2 (got ${idx81}, ${idx82})`);
  assert.match(s8Items[idx81].labelCn, /暴露控制/);
  assert.match(s8Items[idx81].labelEn, /Exposure controls/i);
  assert.match(s8Items[idx82].labelCn, /控制参数/);
  assert.match(s8Items[idx82].labelEn, /Control parameters/i);

  // 3. S9.19 / S9.20 preserve /°C
  const s9Items = ctx2.sections[9].items;
  const mfft = s9Items.find(it => it.seq === '9.19');
  const tg = s9Items.find(it => it.seq === '9.20');
  assert.ok(mfft && /°C/.test(mfft.labelEn), `9.19 EN label must preserve °C, got: ${mfft?.labelEn}`);
  assert.ok(tg && /°C/.test(tg.labelEn), `9.20 EN label must preserve °C, got: ${tg?.labelEn}`);

  // 4. S9.11 g/cm3 spacing
  const density = s9Items.find(it => it.seq === '9.11');
  assert.ok(density && !/\d+(?:\.\d+)?g\/cm3/i.test(density.valueEn), `9.11 EN must have space before g/cm3, got: ${density?.valueEn}`);

  // 5. Phase 2 mechanical audit passes
  const p2 = auditPhase2Context2({ context2: ctx2 });
  assert.equal(p2.ok, true, `Phase 2 audit must pass, got findings: ${JSON.stringify(p2.findings)}`);
});

test('Mutation gate: auditPhase2Context2 catches injected g/cm3 missing space and (e. g., typo', async () => {
  const mutatedCtx2 = {
    validation: { isValid: true, untranslatedCount: 0, numericMismatchCount: 0 },
    sections: {
      9: { items: [{ labelCn: '密度', valueCn: '1.0-1.1 g/cm3', labelEn: '9.11 Density:', valueEn: '1.0-1.1g/cm3' }] },
      13: { items: [{ labelCn: '处理方法', valueCn: '倒空', labelEn: 'Disposal:', valueEn: 'Empty (e. g., pouring)' }] }
    }
  };
  const res = auditPhase2Context2({ context2: mutatedCtx2 });
  assert.equal(res.ok, false);
  const ruleIds = res.findings.map(f => f.ruleId);
  assert.ok(ruleIds.includes('P2_UNIT_SPACING'));
  assert.ok(ruleIds.includes('P2_EN_EG_SPACING'));
});
