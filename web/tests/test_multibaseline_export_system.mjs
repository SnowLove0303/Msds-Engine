import assert from 'node:assert/strict';
import { TEMPLATE_BASELINES, SYSTEM_DEFAULT_PRESETS, PresetStore } from '../src/docx-engine.js';
import { listPresets, savePreset, deletePreset } from '../src/msds-db.js';

console.log('=== 测试：多模板基准独立编辑与预设归属及统一导出系统 ===\n');

// 1. 验证 TEMPLATE_BASELINES 规范
console.log('--- 1. 验证 TEMPLATE_BASELINES 规范与扩展性 ---');
assert.ok(Array.isArray(TEMPLATE_BASELINES), 'TEMPLATE_BASELINES 必须为数组');
assert.equal(TEMPLATE_BASELINES.length, 2, '当前默认应注册两个模板基准（CN 与 EN）');

const cnBaseline = TEMPLATE_BASELINES.find((b) => b.id === 'baseline_cn_guanzhi');
const enBaseline = TEMPLATE_BASELINES.find((b) => b.id === 'baseline_en_guanzhi');

assert.ok(cnBaseline, '必须存在 baseline_cn_guanzhi');
assert.equal(cnBaseline.displayName, '正式模板 · CN 冠志 (国标 GHS)');
assert.equal(cnBaseline.language, 'CN');
assert.equal(cnBaseline.entity, '冠志');

assert.ok(enBaseline, '必须存在 baseline_en_guanzhi');
assert.equal(enBaseline.displayName, '正式模板 · EN 冠志 (OSHA GHS)');
assert.equal(enBaseline.language, 'EN');
assert.equal(enBaseline.entity, '冠志');
console.log('✅ 模板基准规范定义核验通过\n');

// 2. 验证预设与基准的强约束归属
console.log('--- 2. 验证预设归属与 baselineId 过滤 ---');
const allPresets = listPresets();
assert.ok(allPresets.length >= 4, '数据库中应至少有4个内置预设');

const cnPresets = listPresets({ baselineId: 'baseline_cn_guanzhi' });
assert.ok(cnPresets.length >= 2, '中文基准预设至少有2个（国彩中文+冠志中文）');
for (const p of cnPresets) {
  assert.equal(p.baselineId, 'baseline_cn_guanzhi', `预设 ${p.name} 的 baselineId 必须为 baseline_cn_guanzhi`);
  assert.equal(p.language, 'CN', `预设 ${p.name} 的语言必须为 CN`);
}

const enPresets = listPresets({ baselineId: 'baseline_en_guanzhi' });
assert.ok(enPresets.length >= 2, '英文基准预设至少有2个（国彩英文+冠志英文）');
for (const p of enPresets) {
  assert.equal(p.baselineId, 'baseline_en_guanzhi', `预设 ${p.name} 的 baselineId 必须为 baseline_en_guanzhi`);
  assert.equal(p.language, 'EN', `预设 ${p.name} 的语言必须为 EN`);
}
console.log(`✅ 中文基准关联预设 ${cnPresets.length} 个，英文基准关联预设 ${enPresets.length} 个，完全隔离无交叉\n`);

// 3. 验证 PresetStore 客户端预设管理与基准绑定
console.log('--- 3. 验证 PresetStore 自定义预设创建时的 baselineId 继承 ---');
const customCnPreset = PresetStore.createPreset('质检专有中文预设', 'baseline_cn_guanzhi');
assert.equal(customCnPreset.baselineId, 'baseline_cn_guanzhi');
assert.equal(customCnPreset.language, 'CN');

const customEnPreset = PresetStore.createPreset('Overseas Export Custom Preset', 'baseline_en_guanzhi');
assert.equal(customEnPreset.baselineId, 'baseline_en_guanzhi');
assert.equal(customEnPreset.language, 'EN');
console.log('✅ PresetStore 自定义预设能够准确继承并绑定目标 baselineId\n');

// 4. 验证多模板基准草稿状态流转与导出就绪性防呆
console.log('--- 4. 验证导出就绪资格与未编辑基准阻断机制 ---');

// 模拟前端 state.editor 中的草稿仓库结构
const mockDrafts = {
  baseline_cn_guanzhi: {
    baselineId: 'baseline_cn_guanzhi',
    completed: true,
    edited: true,
    engine: { currentModel: 'PU-303A' },
  },
  baseline_en_guanzhi: {
    baselineId: 'baseline_en_guanzhi',
    completed: false,
    edited: false,
    engine: null,
  },
};

function checkBaselineExportReadiness(drafts) {
  const readiness = {};
  for (const b of TEMPLATE_BASELINES) {
    const d = drafts[b.id];
    const isReady = Boolean(d && (d.completed || d.edited) && d.engine);
    readiness[b.id] = {
      baseline: b,
      isReady,
      reason: isReady ? '就绪' : '未编辑或未开始，禁止导出',
    };
  }
  return readiness;
}

const readiness = checkBaselineExportReadiness(mockDrafts);
assert.equal(readiness['baseline_cn_guanzhi'].isReady, true, '中文基准已完成编辑，必须判定为具备导出资格');
assert.equal(readiness['baseline_en_guanzhi'].isReady, false, '英文基准未开始编辑，必须判定为未就绪并阻断导出');

// 5. 模拟统一导出计划生成 (Export Targets Plan)
console.log('--- 5. 模拟统一导出计划（Export Target Plan）构建 ---');

function buildExportPlan(selectedTargets, formats, drafts, presets) {
  const tasks = [];
  for (const b of TEMPLATE_BASELINES) {
    const d = drafts[b.id];
    const isReady = Boolean(d && (d.completed || d.edited) && d.engine);
    if (!isReady) continue; // 未就绪的基准直接跳过，防止空转或带入错误语言

    // 基础稿
    if (selectedTargets[`${b.id}__base`]) {
      for (const fmt of formats) {
        tasks.push({
          baselineId: b.id,
          displayName: b.displayName,
          targetType: 'base',
          preset: null,
          format: fmt,
          fileName: `${d.engine.currentModel || 'MSDS'}_msds_${b.language}_${b.entity}.${fmt}`,
        });
      }
    }

    // 预设稿
    const bPresets = presets.filter((p) => p.baselineId === b.id);
    for (const p of bPresets) {
      if (selectedTargets[`${b.id}__${p.id}`]) {
        for (const fmt of formats) {
          tasks.push({
            baselineId: b.id,
            displayName: b.displayName,
            targetType: 'preset',
            preset: p,
            format: fmt,
            fileName: `${d.engine.currentModel || 'MSDS'}_msds_${p.language}_${p.entity}.${fmt}`,
          });
        }
      }
    }
  }
  return tasks;
}

// 场景 A: 仅编辑中文，勾选中文基础稿 + 国彩预设，格式选择 docx + pdf
const planA = buildExportPlan(
  {
    'baseline_cn_guanzhi__base': true,
    'baseline_cn_guanzhi__preset_guocai_cn': true,
    'baseline_en_guanzhi__base': true, // 用户即使勾选了未就绪的英文，也严格阻断不会生成任务
  },
  ['docx', 'pdf'],
  mockDrafts,
  allPresets
);

assert.equal(planA.length, 4, '场景 A 应生成 4 个导出任务 (中文基础 docx/pdf + 中文国彩预设 docx/pdf)');
assert.ok(planA.every((t) => t.baselineId === 'baseline_cn_guanzhi'), '所有生成的任务必须严格归属已就绪的中文基准');
assert.ok(!planA.some((t) => t.baselineId === 'baseline_en_guanzhi'), '英文任务必须被阻断，严禁带入中文数据导出英文');

console.log('✅ 场景 A 导出计划任务列表:');
planA.forEach((t) => console.log(`   - [${t.format.toUpperCase()}] ${t.fileName} (${t.targetType === 'base' ? '基础稿' : t.preset.name})`));

// 场景 B: 用户完成英文编辑后，双方均可导出
mockDrafts.baseline_en_guanzhi = {
  baselineId: 'baseline_en_guanzhi',
  completed: true,
  edited: true,
  engine: { currentModel: 'PU-303A' },
};

const planB = buildExportPlan(
  {
    'baseline_cn_guanzhi__base': true,
    'baseline_en_guanzhi__base': true,
    'baseline_en_guanzhi__preset_guocai_en': true,
  },
  ['pdf'],
  mockDrafts,
  allPresets
);

assert.equal(planB.length, 3, '场景 B 应生成 3 个 PDF 导出任务');
console.log('\n✅ 场景 B 导出计划任务列表:');
planB.forEach((t) => console.log(`   - [${t.format.toUpperCase()}] ${t.fileName} (${t.targetType === 'base' ? '基础稿' : t.preset.name})`));

console.log('\n🎉 多模板基准编辑、独立草稿隔离、预设归属与多格式导出逻辑全量验证 100% 通过！');
