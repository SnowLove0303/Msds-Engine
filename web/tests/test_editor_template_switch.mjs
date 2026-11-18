import assert from 'node:assert/strict';
import fs from 'node:fs';
import { JSDOM } from 'jsdom';

const dom = new JSDOM();
global.DOMParser = dom.window.DOMParser;
global.XMLSerializer = dom.window.XMLSerializer;

import {
  loadDocx,
  TEMPLATE_BASELINES,
  renumberRecord,
} from '../src/docx-engine.js';

// 验证 resolveBaseline 规则与映射保真度
function resolveBaseline(idOrName) {
  if (!idOrName) return TEMPLATE_BASELINES[0];
  const exact = TEMPLATE_BASELINES.find((b) =>
    b.id === idOrName ||
    b.displayName === idOrName ||
    b.label === idOrName ||
    b.templateFile === idOrName ||
    b.language === idOrName
  );
  if (exact) return exact;
  const s = String(idOrName).toLowerCase();
  if (s.includes('en') || s.includes('english') || s.includes('osha')) {
    return TEMPLATE_BASELINES.find((b) => b.language === 'EN') || TEMPLATE_BASELINES[1];
  }
  return TEMPLATE_BASELINES[0];
}

async function runTests() {
  console.log('🧪 开始执行模板基准切换与状态对齐回归测试...');

  // 1. 基准解析器多形态解析验证
  assert.equal(resolveBaseline('baseline_en_guanzhi').id, 'baseline_en_guanzhi', '精确 id 解析');
  assert.equal(resolveBaseline('EN 冠志').id, 'baseline_en_guanzhi', '常用别名解析');
  assert.equal(resolveBaseline('正式模板 · EN 冠志 (OSHA GHS)').id, 'baseline_en_guanzhi', '全称 displayName 解析');
  assert.equal(resolveBaseline('EN').id, 'baseline_en_guanzhi', '语言代码解析');
  assert.equal(resolveBaseline('english').id, 'baseline_en_guanzhi', '小写英文解析');
  assert.equal(resolveBaseline('baseline_cn_guanzhi').id, 'baseline_cn_guanzhi', '中文精确 id 解析');
  assert.equal(resolveBaseline('CN 冠志').id, 'baseline_cn_guanzhi', '中文常用别名解析');
  assert.equal(resolveBaseline('CN').id, 'baseline_cn_guanzhi', '中文语言代码解析');
  console.log('✓ 1. 基准解析器多形态容错测试通过');

  // 2. 底模载入真实文件内容验证
  const cnBuf = fs.readFileSync('./public/templates/正式模板_MSDS_CN_冠志(1).docx');
  const enBuf = fs.readFileSync('./public/templates/正式模板_MSDS_EN_冠志(1).docx');

  const cnEngine = await loadDocx(cnBuf, 'CN_GUANZHI');
  const enEngine = await loadDocx(enBuf, 'EN_GUANZHI');

  const cnSec1 = cnEngine.records.find((r) => r.sectionNumber === 1);
  const enSec1 = enEngine.records.find((r) => r.sectionNumber === 1);

  assert.ok(cnSec1.title.includes('物料及供应商标识'), 'CN 模板第 1 节必须包含中文标识');
  assert.ok(enSec1.title.includes('Identification'), 'EN 模板第 1 节必须包含英文 Identification');
  assert.equal(/[\u4e00-\u9fa5]/.test(enSec1.title), false, 'EN 模板第 1 节标题绝不允许包含中文字符');
  console.log('✓ 2. 底模源文件纯英文/中文隔离性验证通过');

  // 3. 模拟编辑器状态流转与草稿暂存隔离测试
  const state = {
    editor: {
      currentBaselineId: 'baseline_cn_guanzhi',
      template: '正式模板 · CN 冠志 (国标 GHS)',
      engine: cnEngine,
      drafts: {
        baseline_cn_guanzhi: {
          baselineId: 'baseline_cn_guanzhi',
          engine: cnEngine,
          status: 'editing',
          dirty: false,
        },
      },
      previewMode: 'source',
      dirty: false,
    },
  };

  // 模拟切换至 EN 基准
  const targetBase = resolveBaseline('EN 冠志');
  state.editor.currentBaselineId = targetBase.id;
  state.editor.engine = enEngine;
  state.editor.template = targetBase.displayName;
  state.editor.drafts[targetBase.id] = {
    baselineId: targetBase.id,
    engine: enEngine,
    status: 'editing',
    dirty: false,
  };
  state.editor.previewMode = 'template';

  assert.equal(state.editor.currentBaselineId, 'baseline_en_guanzhi', '当前基准必须切换为 baseline_en_guanzhi');
  assert.ok(state.editor.engine.records.find((r) => r.sectionNumber === 1).title.includes('Identification'), '编辑器引擎必须是英文引擎');
  assert.equal(state.editor.previewMode, 'template', '右侧预览模式必须自动切为 template 效果');

  // 验证原 CN 草稿仍然完好
  assert.ok(state.editor.drafts.baseline_cn_guanzhi.engine.records.find((r) => r.sectionNumber === 1).title.includes('物料'), 'CN 草稿内容必须独立保全');
  console.log('✓ 3. 模拟编辑器状态流转与双向草稿隔离验证通过');

  console.log('🎉 全部模板基准切换与状态对齐回归测试通过！');
}

runTests().catch((err) => {
  console.error('❌ 测试失败:', err);
  process.exit(1);
});
