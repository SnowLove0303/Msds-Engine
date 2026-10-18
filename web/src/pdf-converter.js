import { execFile, execFileSync } from 'node:child_process';
import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
/** 仓库根目录（web/src → ../..），用于定位交付物内置运行时。 */
const REPO_ROOT = path.resolve(__dirname, '..', '..');

/** 环境变量：显式指定转换器可执行文件（最高优先级）。 */
export const ENV_SOFFICE_PATH = 'MSDS_PDF_SOFFICE';
/** 环境变量：覆盖交付物内置运行时目录。 */
export const ENV_BUNDLED_DIR = 'MSDS_PDF_BUNDLED_DIR';
/** 环境变量：覆盖转换用 LibreOffice 用户配置目录（影响确定性）。 */
export const ENV_PROFILE_DIR = 'MSDS_PDF_PROFILE_DIR';
/** 环境变量：显式启用或禁用 Windows COM 层（'1'/'true' 启用，'0'/'false' 禁用）。 */
export const ENV_FORCE_COM = 'MSDS_PDF_FORCE_COM';
/** 环境变量：显式硬关闭 PDF 导出（'1'/'true' 禁用全部后端解析）。 */
export const ENV_DISABLE = 'MSDS_PDF_DISABLE';

/** 交付物内置运行时约定目录。 */
export const BUNDLED_RUNTIME_DIR = path.join(REPO_ROOT, 'tools', 'libreoffice');
/** 固定导出 filter，保证导出参数可复现。 */
export const EXPORT_FILTER = 'pdf:writer_pdf_Export';

const CAPABILITY_TTL_MS = 30_000;

/** 后端解析层级顺序（用于诊断输出的稳定排序）。 */
const TIER_ORDER = ['env', 'com', 'bundled', 'system'];
/** 各层级的人类可读名称。 */
const TIER_LABELS = {
  env: '环境变量指定',
  com: 'Windows COM 自动化',
  bundled: '交付物内置运行时',
  system: '系统已安装转换器',
};

/** @type {{ value: any, at: number } | null} */
let capabilityCache = null;
let comProbeCache = null;
const versionCache = new Map();

/* ------------------------------------------------------------------ *
 * 可执行文件探测
 * ------------------------------------------------------------------ */

function isExecutableFile(p) {
  try {
    const st = fsSync.statSync(p);
    if (!st.isFile()) return false;
    if (process.platform !== 'win32') {
      fsSync.accessSync(p, fsSync.constants.X_OK);
    }
    return true;
  } catch {
    return false;
  }
}

/** 在 PATH 中按平台后缀查找同名可执行文件。 */
function findOnPath(names) {
  const entries = (process.env.PATH || '').split(path.delimiter).filter(Boolean);
  const suffixes = process.platform === 'win32' ? ['', '.com', '.exe', '.cmd', '.bat'] : [''];
  for (const dir of entries) {
    for (const name of names) {
      for (const suffix of suffixes) {
        const candidate = path.join(dir, name + suffix);
        if (isExecutableFile(candidate)) return candidate;
      }
    }
  }
  return null;
}

/** 解析候选列表：绝对路径直接判定，裸名走 PATH 查找。 */
function resolveFromCandidates(candidates) {
  const bare = [];
  for (const c of candidates) {
    if (!c) continue;
    if (path.isAbsolute(c)) {
      if (isExecutableFile(c)) return c;
    } else {
      bare.push(c);
    }
  }
  if (bare.length) return findOnPath(bare);
  return null;
}

/** 交付物内置运行时候选路径（含可移植归档的多种布局）。 */
export function bundledCandidates() {
  const dir = process.env[ENV_BUNDLED_DIR] || BUNDLED_RUNTIME_DIR;
  const candidates = [];

  // 清单优先：获取脚本解包后会写入 runtime.json 记录真实可执行文件位置，
  // 使解析不受各平台官方归档内部布局差异影响。
  try {
    const manifestPath = path.join(dir, 'runtime.json');
    if (fsSync.existsSync(manifestPath)) {
      const manifest = JSON.parse(fsSync.readFileSync(manifestPath, 'utf8'));
      const declared = typeof manifest?.soffice === 'string' ? manifest.soffice : null;
      if (declared) {
        candidates.push(path.isAbsolute(declared) ? declared : path.join(dir, declared));
      }
    }
  } catch {
    // 清单损坏时忽略，继续走布局探测
  }

  candidates.push(
    path.join(dir, 'program', 'soffice.com'),
    path.join(dir, 'program', 'soffice.exe'),
    path.join(dir, 'program', 'soffice'),
    path.join(dir, 'soffice'),
    path.join(dir, 'Contents', 'MacOS', 'soffice'),
    path.join(dir, 'MacOS', 'soffice'),
    path.join(dir, 'LibreOffice.app', 'Contents', 'MacOS', 'soffice'),
    path.join(dir, 'program', 'soffice.bin'),
  );
  return candidates;
}

/** 系统已安装转换器候选路径。 */
export function systemCandidates() {
  if (process.platform === 'win32') {
    return [
      'C:\\Program Files\\LibreOffice\\program\\soffice.com',
      'C:\\Program Files\\LibreOffice\\program\\soffice.exe',
      'C:\\Program Files (x86)\\LibreOffice\\program\\soffice.com',
      'C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe',
      'soffice',
    ];
  }
  if (process.platform === 'darwin') {
    return [
      '/Applications/LibreOffice.app/Contents/MacOS/soffice',
      '/opt/homebrew/bin/soffice',
      '/usr/local/bin/soffice',
      'soffice',
    ];
  }
  return [
    '/usr/bin/soffice',
    '/usr/bin/libreoffice',
    '/usr/local/bin/soffice',
    '/snap/bin/libreoffice',
    '/opt/libreoffice/program/soffice',
    'soffice',
    'libreoffice',
  ];
}

/* ------------------------------------------------------------------ *
 * Windows COM 探测（保持既有语义，仅补缓存开关）
 * ------------------------------------------------------------------ */

/**
 * 探测 Windows 环境下是否存在 WPS 或 Office COM 自动化组件。
 * @param {{ refresh?: boolean }} [options]
 */
export function isWindowsComAvailable(options = {}) {
  if (process.platform !== 'win32') return false;
  if (!options.refresh && comProbeCache !== null) return comProbeCache;
  try {
    const stdout = execFileSync('powershell.exe', [
      '-NoProfile',
      '-ExecutionPolicy',
      'Bypass',
      '-Command',
      "$app = $null; try { try { $app = New-Object -ComObject kwps.application } catch { try { $app = New-Object -ComObject wps.application } catch { $app = New-Object -ComObject Word.Application } }; if ($app) { Write-Output 'OK' } } finally { if ($app) { $app.Quit() } }",
    ], { timeout: 8000, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
    comProbeCache = String(stdout).includes('OK');
  } catch {
    comProbeCache = false;
  }
  return comProbeCache;
}

/* ------------------------------------------------------------------ *
 * 字体就绪探测
 * ------------------------------------------------------------------ */

const CJK_FONT_DIR_HINTS = [
  '/usr/share/fonts/opentype/noto',
  '/usr/share/fonts/truetype/noto',
  '/usr/share/fonts/noto-cjk',
  '/usr/share/fonts/truetype/arphic',
  '/usr/share/fonts/truetype/wqy',
  '/usr/share/fonts/opentype/source-han-sans',
  '/usr/share/fonts/opentype/source-han-serif',
  '/Library/Fonts',
  '/System/Library/Fonts',
];

const CJK_FONT_STEMS = ['NotoSansCJK', 'NotoSerifCJK', 'SourceHanSans', 'SourceHanSerif', 'wqy', 'uming', 'ukai', 'msyh', 'simsun', 'simhei'];

function dirContainsCjkFont(dir) {
  try {
    const entries = fsSync.readdirSync(dir);
    return entries.some((name) => CJK_FONT_STEMS.some((stem) => name.toLowerCase().includes(stem.toLowerCase())));
  } catch {
    return false;
  }
}

/**
 * 判定中文字体是否就绪。
 * @returns {{ status: 'ready'|'missing'|'unknown', detail: string, matched: string|null }}
 */
export function checkCjkFonts() {
  if (process.platform === 'win32') {
    return { status: 'ready', detail: 'Windows 系统自带中文字体（无需额外安装）', matched: 'system' };
  }
  try {
    const out = execFileSync('fc-list', [':lang=zh', 'family'], {
      timeout: 5000,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    const first = String(out).split('\n').map((l) => l.trim()).filter(Boolean)[0] || null;
    if (first) return { status: 'ready', detail: `fontconfig 报告可用中文字体：${first}`, matched: first };
    return { status: 'missing', detail: 'fontconfig 未报告任何中文字体', matched: null };
  } catch {
    for (const hint of CJK_FONT_DIR_HINTS) {
      if (dirContainsCjkFont(hint)) {
        return { status: 'ready', detail: `字体目录命中：${hint}`, matched: hint };
      }
    }
    return { status: 'unknown', detail: '环境缺少 fc-list，且未在常见字体目录命中中文字体', matched: null };
  }
}

/* ------------------------------------------------------------------ *
 * 能力描述与四层解析
 * ------------------------------------------------------------------ */

function probeVersion(executable) {
  if (!executable) return null;
  if (versionCache.has(executable)) return versionCache.get(executable);
  let version = null;
  try {
    const out = execFileSync(executable, ['--version'], {
      timeout: 15000,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    version = String(out).split('\n').map((l) => l.trim()).filter(Boolean)[0] || null;
  } catch {
    version = null;
  }
  versionCache.set(executable, version);
  return version;
}

function buildCapability() {
  const attempts = [];
  let backend = null;
  let executable = null;

  // 显式硬关闭：运维可整体停用 PDF 导出；同时让"能力缺失"的降级路径可被确定性测试
  const disableSetting = (process.env[ENV_DISABLE] || '').trim().toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(disableSetting)) {
    const fonts = checkCjkFonts();
    return {
      available: false,
      backend: null,
      backendLabel: null,
      executable: null,
      version: null,
      exportFilter: null,
      fontsReady: fonts.status === 'ready',
      fontsStatus: fonts.status,
      fontsDetail: fonts.detail,
      fontsMatched: fonts.matched,
      profileDir: resolveProfileDir(),
      platform: process.platform,
      reason: `PDF 导出已被环境变量 ${ENV_DISABLE} 显式禁用`,
      remedy: `如需恢复 PDF 导出，请移除环境变量 ${ENV_DISABLE} 并重启服务`,
      warnings: [],
      attempts: TIER_ORDER.map((tier) => ({
        source: tier,
        label: TIER_LABELS[tier],
        ok: false,
        skipped: true,
        detail: `未评估（已被 ${ENV_DISABLE} 禁用）`,
      })),
      probedAt: new Date().toISOString(),
      disabled: true,
    };
  }

  // 第 1 层：环境变量显式指定
  const envPath = (process.env[ENV_SOFFICE_PATH] || '').trim();
  if (envPath) {
    const resolved = path.isAbsolute(envPath)
      ? (isExecutableFile(envPath) ? envPath : null)
      : findOnPath([envPath]);
    attempts.push({
      source: 'env',
      label: '环境变量指定',
      ok: Boolean(resolved),
      detail: resolved ? `使用 ${resolved}` : `环境变量 ${ENV_SOFFICE_PATH} 指向的路径不可执行：${envPath}`,
    });
    if (resolved) {
      backend = 'env';
      executable = resolved;
    }
  } else {
    attempts.push({ source: 'env', label: '环境变量指定', ok: false, detail: `未设置 ${ENV_SOFFICE_PATH}` });
  }

  // 第 2 层：Windows COM（仅 Windows，可被 MSDS_PDF_FORCE_COM 显式开关）
  if (!backend) {
    const comSetting = (process.env[ENV_FORCE_COM] || '').trim().toLowerCase();
    const comDisabled = ['0', 'false', 'no', 'off'].includes(comSetting);
    const comForced = ['1', 'true', 'yes', 'on'].includes(comSetting);
    if (process.platform !== 'win32') {
      attempts.push({ source: 'com', label: 'Windows COM 自动化', ok: false, detail: `平台 ${process.platform} 不支持 COM` });
    } else if (comDisabled) {
      attempts.push({ source: 'com', label: 'Windows COM 自动化', ok: false, detail: `已被 ${ENV_FORCE_COM} 显式禁用` });
    } else {
      const comOk = comForced ? true : isWindowsComAvailable();
      attempts.push({
        source: 'com',
        label: 'Windows COM 自动化',
        ok: comOk,
        detail: comOk
          ? `检测到可用的 WPS/Word COM 组件${comForced ? `（由 ${ENV_FORCE_COM} 强制启用）` : ''}`
          : '未检测到可用的 WPS/Word COM 组件',
      });
      if (comOk) backend = 'com';
    }
  }

  // 第 3 层：交付物内置运行时
  if (!backend) {
    const bundled = resolveFromCandidates(bundledCandidates());
    attempts.push({
      source: 'bundled',
      label: '交付物内置运行时',
      ok: Boolean(bundled),
      detail: bundled ? `命中 ${bundled}` : `未在 ${process.env[ENV_BUNDLED_DIR] || BUNDLED_RUNTIME_DIR} 找到可执行转换器`,
    });
    if (bundled) {
      backend = 'bundled';
      executable = bundled;
    }
  }

  // 第 4 层：系统已安装转换器
  if (!backend) {
    const system = resolveFromCandidates(systemCandidates());
    attempts.push({
      source: 'system',
      label: '系统已安装转换器',
      ok: Boolean(system),
      detail: system ? `命中 ${system}` : '系统未安装 LibreOffice 或不在已知路径与 PATH 中',
    });
    if (system) {
      backend = 'system';
      executable = system;
    }
  }

  // 未被评估的层级（已由更高优先级后端满足）也如实登记，便于排查"为什么没走内置运行时"
  const evaluated = new Set(attempts.map((a) => a.source));
  for (const tier of TIER_ORDER) {
    if (!evaluated.has(tier)) {
      attempts.push({
        source: tier,
        label: TIER_LABELS[tier],
        ok: false,
        skipped: true,
        detail: '未评估（已由更高优先级的后端满足）',
      });
    }
  }
  attempts.sort((a, b) => TIER_ORDER.indexOf(a.source) - TIER_ORDER.indexOf(b.source));

  const fonts = checkCjkFonts();
  const available = Boolean(backend);
  const warnings = [];
  if (available && fonts.status === 'missing') {
    warnings.push('转换器可用，但未检测到中文字体，中文内容可能渲染为缺字方块');
  }
  if (available && fonts.status === 'unknown') {
    warnings.push('无法确认中文字体就绪状态，建议核对交付物字体安装');
  }

  const backendLabel = backend
    ? (attempts.find((a) => a.source === backend)?.label || backend)
    : null;
  const missingParts = attempts.filter((a) => !a.ok).map((a) => a.label);

  return {
    available,
    backend,
    backendLabel,
    executable,
    version: backend && backend !== 'com' ? probeVersion(executable) : (backend === 'com' ? 'via COM (WPS/Word)' : null),
    exportFilter: backend && backend !== 'com' ? EXPORT_FILTER : null,
    fontsReady: fonts.status === 'ready',
    fontsStatus: fonts.status,
    fontsDetail: fonts.detail,
    fontsMatched: fonts.matched,
    profileDir: resolveProfileDir(),
    platform: process.platform,
    reason: available ? null : `未找到可用的 PDF 转换运行时，已尝试：${missingParts.join(' → ')}`,
    remedy: available
      ? null
      : `请任选其一：1) 设置环境变量 ${ENV_SOFFICE_PATH} 指向转换器；2) 把运行时放入 ${BUNDLED_RUNTIME_DIR}（可执行 scripts/fetch-pdf-runtime.* 获取）；3) 在系统安装 LibreOffice；4) Windows 上安装 WPS 或 Office 以启用 COM 转换`,
    warnings,
    attempts,
    probedAt: new Date().toISOString(),
  };
}

/**
 * 读取当前 PDF 能力描述（带 30 秒缓存）。
 * @param {{ refresh?: boolean }} [options]
 */
export function getPdfCapability(options = {}) {
  const now = Date.now();
  if (!options.refresh && capabilityCache && now - capabilityCache.at < CAPABILITY_TTL_MS) {
    return capabilityCache.value;
  }
  const value = buildCapability();
  capabilityCache = { value, at: now };
  return value;
}

/** 兼容既有调用：保留布尔可用性语义。 */
export function isPdfConverterAvailable() {
  return getPdfCapability().available;
}

/** 兼容既有调用：返回解析到的转换器路径，未命中时回退为平台默认名。 */
export function getSofficePath() {
  const cap = getPdfCapability();
  if (cap.backend && cap.backend !== 'com') return cap.executable;
  return process.platform === 'win32' ? 'soffice.com' : 'soffice';
}

/* ------------------------------------------------------------------ *
 * 转换实现
 * ------------------------------------------------------------------ */

function resolveProfileDir() {
  const configured = (process.env[ENV_PROFILE_DIR] || '').trim();
  if (configured) return configured;
  return path.join(os.tmpdir(), 'msds-pdf-lo-profile');
}

/**
 * 基于 Windows COM (优先 WPS，其次 Word) 批量将临时目录下的 docx 转译为同名 pdf
 */
async function convertViaWindowsCom(tmpDir, timeoutMs = 60000) {
  const psScript = `
param([string]$dir)
$ErrorActionPreference = "Stop"
$app = $null
try {
    try {
        $app = New-Object -ComObject kwps.application
    } catch {
        try {
            $app = New-Object -ComObject wps.application
        } catch {
            $app = New-Object -ComObject Word.Application
        }
    }
    $app.Visible = $false
    $files = Get-ChildItem -Path $dir -Filter "*.docx"
    foreach ($f in $files) {
        $pdfPath = [System.IO.Path]::ChangeExtension($f.FullName, ".pdf")
        $doc = $app.Documents.Open($f.FullName, $false, $true)
        $doc.ExportAsFixedFormat($pdfPath, 17)
        $doc.Close($false)
    }
} finally {
    if ($null -ne $app) {
        $app.Quit()
    }
}
`;
  const psPath = path.join(tmpDir, 'convert_batch.ps1');
  await fs.writeFile(psPath, psScript, 'utf8');

  await execFileAsync('powershell.exe', [
    '-NoProfile',
    '-ExecutionPolicy',
    'Bypass',
    '-File',
    psPath,
    tmpDir,
  ], { timeout: timeoutMs, windowsHide: true });
}

/**
 * 基于 LibreOffice 批处理指令转换。
 * 固定用户配置目录与导出 filter，使同一运行时下的导出可复现。
 */
async function convertViaLibreOffice(soffice, inputPaths, tmpDir, timeoutMs = 60000) {
  const profileDir = resolveProfileDir();
  await fs.mkdir(profileDir, { recursive: true });
  const args = [
    `-env:UserInstallation=${pathToFileURL(profileDir).href}`,
    '--headless',
    '--norestore',
    '--nolockcheck',
    '--nodefault',
    '--nologo',
    '--convert-to',
    EXPORT_FILTER,
    ...inputPaths,
    '--outdir',
    tmpDir,
  ];
  await execFileAsync(soffice, args, { timeout: timeoutMs, windowsHide: true });
}

/**
 * 同步将单个 DOCX 二进制数据无损转换为高保真 PDF 二进制文件
 * @param {Buffer|ArrayBuffer|Uint8Array} docxBuffer 输入 DOCX 二进制数据
 * @param {string} fileName 基础文件名（如 PU-2702_MSDS_CN_国彩.docx）
 * @param {object} options 转换控制参数
 * @returns {Promise<{ pdfBuffer: Buffer, pdfName: string, size: number, durationMs: number, backend: string }>}
 */
export async function convertDocxToPdf(docxBuffer, fileName = 'document.docx', options = {}) {
  const [res] = await convertBatchDocxToPdf([{ docxBuffer, fileName }], options);
  return res;
}

/**
 * 批量将多个 DOCX 文件一次性无损转换为高保真 PDF 二进制文件。
 * 后端由四层解析结果决定：Windows 上优先 COM（维持金标排版），其它平台使用内置/系统运行时。
 * @param {Array<{ docxBuffer?: Buffer|ArrayBuffer|Uint8Array, buffer?: Buffer|ArrayBuffer|Uint8Array, fileName?: string, name?: string }>} items 输入 DOCX 文件列表
 * @param {object} options 转换控制参数
 * @returns {Promise<Array<{ pdfBuffer: Buffer, pdfName: string, size: number, durationMs: number, fileName: string, backend: string }>>}
 */
export async function convertBatchDocxToPdf(items = [], options = {}) {
  if (!Array.isArray(items) || items.length === 0) return [];
  const startTime = Date.now();

  const capability = getPdfCapability({ refresh: Boolean(options.refreshCapability) });
  if (!capability.available) {
    const err = new Error(capability.reason || '未找到可用的 PDF 转换运行时');
    err.code = 'PDF_RUNTIME_UNAVAILABLE';
    err.capability = capability;
    throw err;
  }

  const tmpDir = path.join(os.tmpdir(), `msds_pdf_batch_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`);
  await fs.mkdir(tmpDir, { recursive: true });

  try {
    const fileTasks = [];
    const inputPaths = [];
    const expectedOutputs = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const rawBuf = item.docxBuffer || item.buffer;
      if (!rawBuf) continue;
      const buf = Buffer.isBuffer(rawBuf) ? rawBuf : Buffer.from(rawBuf);
      const originalName = item.fileName || item.name || `document_${i + 1}.docx`;
      const baseCleanName = path.basename(originalName, path.extname(originalName));
      const inputDocxPath = path.join(tmpDir, `${baseCleanName}.docx`);
      const outputPdfPath = path.join(tmpDir, `${baseCleanName}.pdf`);

      inputPaths.push(inputDocxPath);
      expectedOutputs.push({
        baseCleanName,
        pdfName: `${baseCleanName}.pdf`,
        outputPdfPath,
        originalName,
      });

      fileTasks.push(fs.writeFile(inputDocxPath, buf));
    }

    await Promise.all(fileTasks);

    const timeoutMs = options.timeoutMs || Math.max(60000, items.length * 20000);
    let convertedSuccessfully = false;

    // 1. Windows COM（仅当解析结果选择 COM 时）
    if (capability.backend === 'com') {
      try {
        await convertViaWindowsCom(tmpDir, timeoutMs);
        convertedSuccessfully = expectedOutputs.every((meta) => fsSync.existsSync(meta.outputPdfPath));
        if (!convertedSuccessfully) {
          console.warn('WPS COM 未产出全部 PDF，尝试降级至 LibreOffice 路径');
        }
      } catch (comErr) {
        console.warn('WPS COM 渲染失败，尝试降级回退至 LibreOffice:', comErr.message);
      }
    }

    // 2. LibreOffice（内置 / 环境变量 / 系统）
    if (!convertedSuccessfully) {
      await convertViaLibreOffice(capability.executable, inputPaths, tmpDir, timeoutMs);
    }

    const totalDurationMs = Date.now() - startTime;

    return await Promise.all(
      expectedOutputs.map(async (meta) => {
        if (!fsSync.existsSync(meta.outputPdfPath)) {
          throw new Error(`PDF 批处理输出文件未生成: ${meta.outputPdfPath}`);
        }
        const pdfBuffer = await fs.readFile(meta.outputPdfPath);
        return {
          pdfBuffer,
          pdfName: meta.pdfName,
          size: pdfBuffer.length,
          durationMs: totalDurationMs,
          fileName: meta.originalName,
          backend: convertedSuccessfully ? 'com' : capability.backend,
        };
      })
    );
  } finally {
    try {
      await fs.rm(tmpDir, { recursive: true, force: true });
    } catch {
      // 忽略临时文件清理告警
    }
  }
}
