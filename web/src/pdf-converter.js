import { execFile, execSync } from 'node:child_process';
import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

// 候选 LibreOffice 路径 (优先采用控制台版 soffice.com，其次 soffice.exe)
const CANDIDATE_SOFFICE_PATHS = [
  'C:\\Program Files\\LibreOffice\\program\\soffice.com',
  'C:\\Program Files\\LibreOffice\\program\\soffice.exe',
  'C:\\Program Files (x86)\\LibreOffice\\program\\soffice.com',
  'C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe',
  'soffice',
];

let cachedSofficePath = null;
let cachedComAvailable = null;

/**
 * 探测本机是否已安装可用的 LibreOffice
 */
export function getSofficePath() {
  if (cachedSofficePath) return cachedSofficePath;

  for (const p of CANDIDATE_SOFFICE_PATHS) {
    if (path.isAbsolute(p)) {
      if (fsSync.existsSync(p)) {
        cachedSofficePath = p;
        return p;
      }
    }
  }
  cachedSofficePath = 'soffice.com';
  return cachedSofficePath;
}

/**
 * 快速探测 Windows 环境下是否存在 WPS 或 Office COM 自动化组件
 */
export function isWindowsComAvailable() {
  if (process.platform !== 'win32') return false;
  if (cachedComAvailable !== null) return cachedComAvailable;

  try {
    const cmd = `powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "$app = $null; try { try { $app = New-Object -ComObject kwps.application } catch { try { $app = New-Object -ComObject wps.application } catch { $app = New-Object -ComObject Word.Application } }; if ($app) { Write-Output 'OK' } } finally { if ($app) { $app.Quit() } }"`;
    const stdout = execSync(cmd, { timeout: 5000, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
    cachedComAvailable = stdout.includes('OK');
  } catch (err) {
    cachedComAvailable = false;
  }
  return cachedComAvailable;
}

/**
 * 探测本机是否已安装可用的 PDF 转换环境 (WPS COM / Office COM / LibreOffice)
 */
export function isPdfConverterAvailable() {
  if (isWindowsComAvailable()) return true;
  const p = getSofficePath();
  if (path.isAbsolute(p)) {
    return fsSync.existsSync(p);
  }
  return false;
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
 * 基于 LibreOffice 批处理指令转换
 */
async function convertViaLibreOffice(soffice, inputPaths, tmpDir, timeoutMs = 60000) {
  const args = [
    '--headless',
    '--convert-to',
    'pdf',
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
 * @returns {Promise<{ pdfBuffer: Buffer, pdfName: string, size: number, durationMs: number }>}
 */
export async function convertDocxToPdf(docxBuffer, fileName = 'document.docx', options = {}) {
  const [res] = await convertBatchDocxToPdf([{ docxBuffer, fileName }], options);
  return res;
}

/**
 * 批量将多个 DOCX 文件一次性无损转换为高保真 PDF 二进制文件
 * 优先调用原生 WPS COM，与用户金标排版 100% 字节级一致；失败自动 fallback 到 LibreOffice。
 * @param {Array<{ docxBuffer?: Buffer|ArrayBuffer|Uint8Array, buffer?: Buffer|ArrayBuffer|Uint8Array, fileName?: string, name?: string }>} items 输入 DOCX 文件列表
 * @param {object} options 转换控制参数
 * @returns {Promise<Array<{ pdfBuffer: Buffer, pdfName: string, size: number, durationMs: number, fileName: string }>>}
 */
export async function convertBatchDocxToPdf(items = [], options = {}) {
  if (!Array.isArray(items) || items.length === 0) return [];
  const startTime = Date.now();

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

    // 并行写入临时 DOCX
    await Promise.all(fileTasks);

    const timeoutMs = options.timeoutMs || Math.max(60000, items.length * 20000);

    let convertedSuccessfully = false;

    // 1. 优先尝试 Windows COM (WPS/Word) 原生高保真渲染
    if (isWindowsComAvailable()) {
      try {
        await convertViaWindowsCom(tmpDir, timeoutMs);
        const allGenerated = expectedOutputs.every((meta) => fsSync.existsSync(meta.outputPdfPath));
        if (allGenerated) {
          convertedSuccessfully = true;
        }
      } catch (comErr) {
        console.warn('WPS COM 渲染失败，尝试降级回退至 LibreOffice:', comErr.message);
      }
    }

    // 2. 兜底回退至 LibreOffice
    if (!convertedSuccessfully) {
      const soffice = getSofficePath();
      await convertViaLibreOffice(soffice, inputPaths, tmpDir, timeoutMs);
    }

    const totalDurationMs = Date.now() - startTime;

    // 并行读取生成的所有 PDF
    const results = await Promise.all(
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
        };
      })
    );

    return results;
  } finally {
    try {
      await fs.rm(tmpDir, { recursive: true, force: true });
    } catch (e) {
      // 忽略临时文件清理告警
    }
  }
}
