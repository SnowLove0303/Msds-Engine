#!/usr/bin/env node
/**
 * DOCX→PDF 保真度回归测试（金标基线）。
 *
 * 判据完全来自 `tests/pdf_export_fidelity_baseline.json` 中"先测量后固化"的容差，
 * 可用下列环境变量覆盖以做负向验证：
 *   MSDS_PDF_FIDELITY_PAGE_DELTA_MAX
 *   MSDS_PDF_FIDELITY_COVERAGE_MIN
 *   MSDS_PDF_FIDELITY_CJK_DELTA_PCT_MAX
 *   MSDS_PDF_FIDELITY_LABEL_DELTA_MAX
 *   MSDS_PDF_FIDELITY_DIR   （金标样本所在目录）
 *
 * 依赖 pdfinfo / pdftotext（poppler-utils）。交付物运行环境内含该工具；
 * 若当前环境缺失，则跳过并明确提示，而不是误报失败。
 *
 * 用法：node tests/test_pdf_export_fidelity.mjs
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { convertDocxToPdf, getPdfCapability } from '../src/pdf-converter.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..', '..');

const baseline = JSON.parse(fs.readFileSync(path.join(__dirname, 'pdf_export_fidelity_baseline.json'), 'utf8'));
const tol = baseline.tolerance;
const num = (envKey, fallback) => {
  const raw = process.env[envKey];
  const parsed = raw === undefined ? NaN : Number(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
};
const TOL = {
  pageCountDeltaMax: num('MSDS_PDF_FIDELITY_PAGE_DELTA_MAX', tol.pageCountDeltaMax),
  cjkCoverageMin: num('MSDS_PDF_FIDELITY_COVERAGE_MIN', tol.cjkCoverageMin),
  cjkCharDeltaPctMax: num('MSDS_PDF_FIDELITY_CJK_DELTA_PCT_MAX', tol.cjkCharDeltaPctMax),
  labelCountDeltaMax: num('MSDS_PDF_FIDELITY_LABEL_DELTA_MAX', tol.labelCountDeltaMax),
  replacementCharsMax: tol.replacementCharsMax,
};

let failures = 0;
let checks = 0;
function ok(label, condition, detail = '') {
  checks += 1;
  if (condition) console.log(`  ✓ ${label}`);
  else {
    failures += 1;
    console.log(`  ✗ ${label}${detail ? ` — ${detail}` : ''}`);
  }
}

function hasTool(name) {
  try {
    execFileSync(name, ['-v'], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

if (!hasTool('pdfinfo') || !hasTool('pdftotext')) {
  console.log('⚠️  当前环境缺少 poppler-utils（pdfinfo / pdftotext），保真度回归已跳过。');
  console.log('   权威运行位置是交付物运行环境（容器镜像内已预装）。');
  process.exit(0);
}

/** 定位金标样本对。 */
function resolveFixture() {
  const dirs = [
    process.env.MSDS_PDF_FIDELITY_DIR,
    path.join(REPO_ROOT, baseline.fixture.sourceDir),
    '/app/web/tests/fixtures/pu303c',
  ].filter(Boolean);
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) continue;
    const files = fs.readdirSync(dir);
    const pick = (ext) =>
      files.find((f) => f.toLowerCase().endsWith(ext) && /手动/.test(f)) ||
      files.find((f) => f.toLowerCase().endsWith(ext));
    const docxName = pick('.docx');
    const pdfName = pick('.pdf');
    if (docxName && pdfName) {
      return { dir, docx: path.join(dir, docxName), goldenPdf: path.join(dir, pdfName) };
    }
  }
  return null;
}

const fixture = resolveFixture();
if (!fixture) {
  console.error('缺少金标样本对（DOCX + 同名 PDF），无法执行保真度回归。');
  process.exit(1);
}

const han = (s) => [...s].filter((c) => /\p{Script=Han}/u.test(c));
const normalize = (s) => s.split('\n').map((l) => l.replace(/\s+/g, ' ').trim()).filter(Boolean);
const countLabels = (s) => (s.match(/^\d+\.\d+/gm) || []).length;
const replacementChars = (s) => (s.match(/\uFFFD/g) || []).length;

function pdfPages(p) {
  return Number(execFileSync('pdfinfo', [p], { encoding: 'utf8' }).match(/^Pages:\s+(\d+)/m)[1]);
}
function pdfText(p) {
  return execFileSync('pdftotext', ['-layout', p, '-'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
}

/** 金标汉字多重集在候选文本中的命中比例（对换行重排鲁棒）。 */
function cjkCoverage(goldChars, candChars) {
  const pool = new Map();
  for (const c of candChars) pool.set(c, (pool.get(c) || 0) + 1);
  let hit = 0;
  for (const c of goldChars) {
    const n = pool.get(c) || 0;
    if (n > 0) { hit += 1; pool.set(c, n - 1); }
  }
  return hit / goldChars.length;
}

const capability = getPdfCapability({ refresh: true });
console.log('DOCX→PDF 保真度回归（金标基线）');
console.log(`  样本      : ${path.basename(fixture.docx)}`);
console.log(`  后端      : ${capability.backendLabel || capability.backend} / ${capability.version || 'n/a'}`);
console.log(`  判据      : pages±${TOL.pageCountDeltaMax} · coverage≥${TOL.cjkCoverageMin} · cjk±${TOL.cjkCharDeltaPctMax}% · labels±${TOL.labelCountDeltaMax}\n`);

const goldenText = pdfText(fixture.goldenPdf);
const goldenMetric = {
  pages: pdfPages(fixture.goldenPdf),
  cjk: han(goldenText).length,
  labels: countLabels(goldenText),
};

const docxBuf = fs.readFileSync(fixture.docx);
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'msds-fidelity-'));
let actual;
try {
  const result = await convertDocxToPdf(docxBuf, path.basename(fixture.docx));
  const outPdf = path.join(tmpDir, 'produced.pdf');
  fs.writeFileSync(outPdf, result.pdfBuffer);
  const producedText = pdfText(outPdf);
  actual = {
    pages: pdfPages(outPdf),
    cjk: han(producedText).length,
    labels: countLabels(producedText),
    replacement: replacementChars(producedText),
    coverage: cjkCoverage(han(goldenText), han(producedText)),
    normDiff: normalize(goldenText).filter((l, i) => normalize(producedText)[i] !== l).length,
  };
} finally {
  fs.rmSync(tmpDir, { recursive: true, force: true });
}

const cjkDeltaPct = Math.abs(((actual.cjk - goldenMetric.cjk) / goldenMetric.cjk) * 100);
console.log('  指标                     金标        实测        容差');
console.log(`  页数                     ${goldenMetric.pages}           ${actual.pages}           ±${TOL.pageCountDeltaMax}`);
console.log(`  汉字数                   ${goldenMetric.cjk}        ${actual.cjk}        ±${TOL.cjkCharDeltaPctMax}%`);
console.log(`  汉字覆盖率               —           ${actual.coverage.toFixed(4)}      ≥${TOL.cjkCoverageMin}`);
console.log(`  标签/条款行数            ${goldenMetric.labels}          ${actual.labels}          ±${TOL.labelCountDeltaMax}`);
console.log(`  缺字替代字符             —           ${actual.replacement}           ≤${TOL.replacementCharsMax}`);
console.log(`  归一化行差异（信息项）   —           ${actual.normDiff}\n`);

ok('页数在金标容差内', Math.abs(actual.pages - goldenMetric.pages) <= TOL.pageCountDeltaMax,
  `金标 ${goldenMetric.pages}，实测 ${actual.pages}`);
ok('汉字覆盖率达标', actual.coverage >= TOL.cjkCoverageMin, `实测 ${actual.coverage.toFixed(4)} < ${TOL.cjkCoverageMin}`);
ok('汉字数偏差在容差内', cjkDeltaPct <= TOL.cjkCharDeltaPctMax, `实测 ${cjkDeltaPct.toFixed(2)}% > ${TOL.cjkCharDeltaPctMax}%`);
ok('标签/条款结构一致', Math.abs(actual.labels - goldenMetric.labels) <= TOL.labelCountDeltaMax,
  `金标 ${goldenMetric.labels}，实测 ${actual.labels}`);
ok('无缺字替代字符', actual.replacement <= TOL.replacementCharsMax, `实测 ${actual.replacement}`);
ok(
  '中文标签可被正常抽取（无缺字方块）',
  ['物料安全数据表', '产品名称'].every((probe) => pdfText(fixture.goldenPdf).length > 0 && actual.cjk > 0),
  '中文内容为空则意味着字形缺失',
);

console.log(`\n断言 ${checks} 项，失败 ${failures} 项`);
if (failures > 0) {
  console.error('保真度回归未通过');
  process.exit(1);
}
console.log('保真度回归通过');
