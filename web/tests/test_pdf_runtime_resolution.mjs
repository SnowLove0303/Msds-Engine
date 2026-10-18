#!/usr/bin/env node
/**
 * PDF 转换运行时"四层解析"回归测试。
 *
 * 覆盖 openspec change `portable-pdf-export-pipeline` 中
 * `Cross-Platform Conversion Availability` 的全部场景：
 *   1. 交付物内置运行时优先于系统安装
 *   2. 环境变量显式指定可覆盖探测（含 COM / 内置 / 系统）
 *   3. Windows 上优先使用 COM 自动化（即使内置可用）
 *   4. 非 Windows 平台使用内置运行时
 *   5. 四层全不可用时回报不可用与可诊断原因
 *
 * 用法：node tests/test_pdf_runtime_resolution.mjs
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  getPdfCapability,
  isPdfConverterAvailable,
  ENV_SOFFICE_PATH,
  ENV_BUNDLED_DIR,
  ENV_FORCE_COM,
} from '../src/pdf-converter.js';

const SANDBOX = fs.mkdtempSync(path.join(os.tmpdir(), 'msds-pdf-resolve-'));
let failures = 0;
let checks = 0;

function ok(label, condition, detail = '') {
  checks += 1;
  if (condition) {
    console.log(`  ✓ ${label}`);
  } else {
    failures += 1;
    console.log(`  ✗ ${label}${detail ? ` — ${detail}` : ''}`);
  }
}

/** 造一个"真实可执行"的假转换器：拷贝系统里一个体积很小的真程序。 */
function makeFakeConverter(dir, name) {
  fs.mkdirSync(dir, { recursive: true });
  const source = process.platform === 'win32'
    ? path.join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'where.exe')
    : '/bin/echo';
  const target = path.join(dir, name);
  fs.copyFileSync(source, target);
  if (process.platform !== 'win32') fs.chmodSync(target, 0o755);
  return target;
}

/** 构造内置运行时的目录布局（<dir>/program/soffice[.exe]）。 */
function makeBundledRuntime(name) {
  const dir = path.join(SANDBOX, name);
  makeFakeConverter(path.join(dir, 'program'), process.platform === 'win32' ? 'soffice.exe' : 'soffice');
  return dir;
}

/**
 * 造一个"系统已安装"的假转换器，同时铺设 soffice 与 soffice.exe 两个名称，
 * 使断言不受测试运行平台（以及被模拟平台）的 PATH 后缀规则影响。
 */
function makeFakeSystemConverter(dir) {
  makeFakeConverter(dir, 'soffice');
  makeFakeConverter(dir, 'soffice.exe');
  return dir;
}

const MANAGED_ENV = [ENV_SOFFICE_PATH, ENV_BUNDLED_DIR, ENV_FORCE_COM, 'PATH', 'MSDS_PDF_PROFILE_DIR'];

async function withEnv(overrides, fn) {
  const saved = new Map();
  for (const key of MANAGED_ENV) saved.set(key, process.env[key]);
  for (const key of MANAGED_ENV) delete process.env[key];
  for (const [key, value] of Object.entries(overrides)) {
    if (value !== undefined) process.env[key] = value;
  }
  try {
    return await fn();
  } finally {
    for (const key of MANAGED_ENV) {
      const previous = saved.get(key);
      if (previous === undefined) delete process.env[key];
      else process.env[key] = previous;
    }
  }
}

async function withPlatform(platform, fn) {
  const descriptor = Object.getOwnPropertyDescriptor(process, 'platform');
  Object.defineProperty(process, 'platform', { value: platform, configurable: true });
  try {
    return await fn();
  } finally {
    Object.defineProperty(process, 'platform', descriptor);
  }
}

const probe = () => getPdfCapability({ refresh: true });
const emptyDir = (name) => {
  const dir = path.join(SANDBOX, name);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
};

console.log(`PDF 运行时分层解析测试（宿主平台 ${process.platform}，沙箱 ${SANDBOX}）\n`);

// ---------------------------------------------------------------- 场景 2
console.log('场景：环境变量显式指定可覆盖探测');
{
  const envExe = makeFakeConverter(path.join(SANDBOX, 'envbin'), process.platform === 'win32' ? 'mysoffice.exe' : 'mysoffice');
  const bundled = makeBundledRuntime('bundled-for-env');
  await withPlatform('win32', () => withEnv({
    [ENV_SOFFICE_PATH]: envExe,
    [ENV_BUNDLED_DIR]: bundled,
    [ENV_FORCE_COM]: '1',
  }, async () => {
    const cap = probe();
    ok('后端为环境变量指定', cap.backend === 'env', `实际 ${cap.backend}`);
    ok('可用性为 true', cap.available === true);
    ok('记录了 COM 被环境变量越过', cap.attempts[0]?.source === 'env' && cap.attempts[1]?.source === 'com');
  }));
}

// ---------------------------------------------------------------- 场景 3
console.log('\n场景：Windows 上优先使用 COM（即使内置运行时可用）');
{
  const bundled = makeBundledRuntime('bundled-for-com');
  await withPlatform('win32', () => withEnv({
    [ENV_BUNDLED_DIR]: bundled,
    [ENV_FORCE_COM]: '1',
  }, async () => {
    const cap = probe();
    ok('后端为 COM', cap.backend === 'com', `实际 ${cap.backend}`);
    ok('内置层被标记为未评估', cap.attempts.some((a) => a.source === 'bundled' && a.skipped === true));
  }));
}

// ---------------------------------------------------------------- 场景 1
console.log('\n场景：内置运行时优先于系统安装');
{
  const bundled = makeBundledRuntime('bundled-beats-system');
  const systemDir = makeFakeSystemConverter(path.join(SANDBOX, 'systembin'));
  await withPlatform('linux', () => withEnv({
    [ENV_BUNDLED_DIR]: bundled,
    PATH: systemDir,
  }, async () => {
    const cap = probe();
    ok('后端为内置运行时', cap.backend === 'bundled', `实际 ${cap.backend}`);
  }));
}

// ---------------------------------------------------------------- 场景 4
console.log('\n场景：非 Windows 平台使用内置运行时');
{
  const bundled = makeBundledRuntime('bundled-linux');
  await withPlatform('linux', () => withEnv({ [ENV_BUNDLED_DIR]: bundled }, async () => {
    const cap = probe();
    ok('后端为内置运行时', cap.backend === 'bundled', `实际 ${cap.backend}`);
    ok('已评估层级中 COM 被记录为不支持', cap.attempts.some((a) => a.source === 'com' && /不支持/.test(a.detail)));
  }));
}

// ---------------------------------------------------------------- 第 4 层
console.log('\n场景：四层中仅系统安装可用时选中系统层');
{
  const systemDir = makeFakeSystemConverter(path.join(SANDBOX, 'system-only'));
  await withPlatform('linux', () => withEnv({
    [ENV_BUNDLED_DIR]: emptyDir('bundled-empty-a'),
    PATH: systemDir,
  }, async () => {
    const cap = probe();
    ok('后端为系统安装', cap.backend === 'system', `实际 ${cap.backend}`);
  }));
}

// ---------------------------------------------------------------- 场景 5
console.log('\n场景：四层全不可用时回报不可用与可诊断原因');
{
  await withPlatform('darwin', () => withEnv({
    [ENV_BUNDLED_DIR]: emptyDir('bundled-empty-b'),
    [ENV_FORCE_COM]: '0',
    PATH: emptyDir('path-empty'),
  }, async () => {
    const cap = probe();
    ok('可用性为 false', cap.available === false, `实际 ${cap.available}（backend=${cap.backend}）`);
    ok('原因为非空文本', typeof cap.reason === 'string' && cap.reason.length > 0);
    ok('原因逐一列出被否决的层级', /环境变量指定/.test(cap.reason) && /交付物内置运行时/.test(cap.reason));
    ok('给出了可操作的补救方式', typeof cap.remedy === 'string' && cap.remedy.includes(ENV_SOFFICE_PATH));
    ok('四层均有评估记录', cap.attempts.length === 4, `实际 ${cap.attempts.length}`);
    ok('没有任何层级成功', cap.attempts.every((a) => !a.ok));
    ok('旧布尔接口同源', isPdfConverterAvailable() === false);
  }));
}

// ---------------------------------------------------------------- 回归保护
console.log('\n回归：isPdfConverterAvailable 旧语义与描述对象一致');
{
  await withEnv({ [ENV_FORCE_COM]: '0' }, async () => {
    const cap = probe();
    ok('同源一致', isPdfConverterAvailable() === cap.available);
  });
}

try {
  fs.rmSync(SANDBOX, { recursive: true, force: true });
} catch {
  /* 忽略清理告警 */
}

console.log(`\n断言 ${checks} 项，失败 ${failures} 项`);
if (failures > 0) {
  console.error('PDF 运行时分层解析测试未通过');
  process.exit(1);
}
console.log('PDF 运行时分层解析测试通过');
