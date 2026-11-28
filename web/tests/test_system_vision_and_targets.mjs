import assert from 'node:assert/strict';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { SYSTEM_VISION_CORE, formatVisionBanner, getMcpVisionInstructions } from '../src/system-vision.js';
import { resolveDynamicTargets } from '../src/target-matrix-resolver.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '../..');

// 1. 系统愿景与通用性准则输出校验
{
  assert.ok(SYSTEM_VISION_CORE.vision.includes('不论源 MSDS 原来长什么样'));
  assert.ok(SYSTEM_VISION_CORE.universalityPrinciples.some(p => p.includes('反硬编码')));
  assert.ok(SYSTEM_VISION_CORE.universalityPrinciples.some(p => p.includes('反情景化')));
  assert.ok(formatVisionBanner().includes('MSDS-Engine 核心愿景'));
  assert.ok(getMcpVisionInstructions().includes('通用性准则'));
  console.log('✅ PASS: 系统构建愿景与通用性准则文本完整');
}

// 2. 动态预设与交付矩阵解析（不依赖硬编码企业名）
{
  const customRegistry = {
    Acme_zh: { name: 'Acme 中文', shortName: 'Acme' },
    Acme_en: { name: 'Acme Corp', shortName: 'Acme' }
  };
  const res1 = resolveDynamicTargets({
    modelCode: 'X-100',
    presetsRegistry: customRegistry,
    presetsArg: 'Acme_en',
    languagesArg: 'en',
    formatsArg: 'docx'
  });
  assert.equal(res1.targets.length, 1);
  assert.equal(res1.targets[0].presetKey, 'Acme_en');
  assert.equal(res1.targets[0].fileName, 'X-100 msds_EN Acme.docx');
  assert.deepEqual(res1.formats, ['docx']);

  const resNoPreset = resolveDynamicTargets({
    modelCode: 'X-200',
    presetsRegistry: customRegistry,
    noPreset: true,
    languagesArg: 'zh',
    templatesArg: 'CUSTOM_TPL'
  });
  assert.equal(resNoPreset.targets.length, 1);
  assert.equal(resNoPreset.targets[0].presetKey, null);
  assert.equal(resNoPreset.targets[0].templateKey, 'CUSTOM_TPL');
  console.log('✅ PASS: 动态预设与无预设模式解析通过');
}

// 3. CLI --help 输出必须包含系统愿景
{
  const runnerPath = path.join(REPO_ROOT, '标准化流程/MSDS_Studio_Agent_Test_Kit/run_standard_production.mjs');
  const out = spawnSync('node', [runnerPath, '--help'], { encoding: 'utf8' });
  assert.equal(out.status, 0);
  assert.ok(out.stdout.includes('不论源 MSDS 原来长什么样'), 'CLI --help 必须输出核心构建愿景');
  assert.ok(out.stdout.includes('--presets='), 'CLI --help 必须说明动态预设参数');
  console.log('✅ PASS: run_standard_production.mjs --help 显式透传系统愿景');
}
