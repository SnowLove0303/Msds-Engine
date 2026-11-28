/**
 * MSDS-Studio 执行血缘凭证账本 (provenance-ledger.js)
 *
 * 核心使命:
 * 1. 为受控流水线 (run_standard_production.mjs / msds_mcp_gateway.mjs) 签发 .run_manifest.json；
 * 2. 记录各阶段 (PHASE_1_CONTEXT1 / PHASE_2_CONTEXT2 / PHASE_5_EXPORT) 与最终 DOCX/PDF 交付物的 SHA-256 指纹；
 * 3. 在终审前校验血缘链完整性与工作区无 ad-hoc 偷跑脚本，彻底阻断 Agent 流程漂移。
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

export const PROVENANCE_MANIFEST_FILENAME = '.run_manifest.json';

export const CANONICAL_ENTRYPOINTS = Object.freeze([
  'run_standard_production.mjs',
  'msds_mcp_gateway.mjs'
]);

const ADHOC_SCRIPT_EXT_RE = /\.(?:mjs|js|cjs|py|ps1|sh|bat)$/i;

export function sha256Buffer(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex');
}

export function sha256File(filePath) {
  return sha256Buffer(fs.readFileSync(filePath));
}

export function sha256Json(obj) {
  return sha256Buffer(Buffer.from(JSON.stringify(obj ?? null), 'utf8'));
}

export function getManifestPath(targetDir) {
  return path.join(path.resolve(targetDir), PROVENANCE_MANIFEST_FILENAME);
}

/**
 * 初始化执行血缘凭证文件 (.run_manifest.json)
 */
export function initProvenanceManifest({
  targetDir,
  runId,
  modelCode,
  sourcePath,
  entrypoint = 'run_standard_production.mjs'
}) {
  if (!CANONICAL_ENTRYPOINTS.includes(entrypoint)) {
    throw new Error(`[PROVENANCE_BLOCKED] 非法入口 "${entrypoint}"，仅允许: ${CANONICAL_ENTRYPOINTS.join(', ')}`);
  }
  const absDir = path.resolve(targetDir);
  fs.mkdirSync(absDir, { recursive: true });
  const manifestPath = getManifestPath(absDir);
  const manifest = {
    schemaVersion: '1.0.0',
    runId: String(runId || `run_${Date.now()}`),
    entrypoint,
    modelCode: String(modelCode || ''),
    sourcePath: sourcePath ? path.resolve(sourcePath) : null,
    sourceSha256: sourcePath && fs.existsSync(sourcePath) ? sha256File(sourcePath) : null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    phases: {},
    deliverables: {}
  };
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n', 'utf8');
  return manifestPath;
}

function loadManifestOrNull(manifestPath) {
  if (!fs.existsSync(manifestPath)) return null;
  return JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
}

/**
 * 记录阶段血缘指纹
 */
export function recordProvenancePhase(manifestPath, phaseKey, { artifactPath = null, data = null, meta = {} } = {}) {
  const manifest = loadManifestOrNull(manifestPath);
  if (!manifest) {
    throw new Error(`[PROVENANCE_BLOCKED] 未找到血缘凭证文件: ${manifestPath}`);
  }
  let hash = null;
  if (artifactPath && fs.existsSync(artifactPath)) {
    hash = sha256File(artifactPath);
  } else if (data !== null && data !== undefined) {
    hash = typeof data === 'string' || Buffer.isBuffer(data) ? sha256Buffer(Buffer.from(data)) : sha256Json(data);
  }
  manifest.phases[phaseKey] = {
    sha256: hash,
    artifactPath: artifactPath ? path.basename(artifactPath) : null,
    recordedAt: new Date().toISOString(),
    meta
  };
  manifest.updatedAt = new Date().toISOString();
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n', 'utf8');
  return manifest.phases[phaseKey];
}

/**
 * 登记最终交付物 (DOCX / PDF) SHA-256 指纹
 */
export function recordProvenanceDeliverable(manifestPath, filePath) {
  const manifest = loadManifestOrNull(manifestPath);
  if (!manifest) {
    throw new Error(`[PROVENANCE_BLOCKED] 未找到血缘凭证文件: ${manifestPath}`);
  }
  const absFile = path.resolve(filePath);
  if (!fs.existsSync(absFile)) {
    throw new Error(`[PROVENANCE_BLOCKED] 无法登记不存在的交付物: ${absFile}`);
  }
  const stat = fs.statSync(absFile);
  const name = path.basename(absFile);
  manifest.deliverables[name] = {
    sha256: sha256File(absFile),
    size: stat.size,
    recordedAt: new Date().toISOString()
  };
  manifest.updatedAt = new Date().toISOString();
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n', 'utf8');
  return manifest.deliverables[name];
}

/**
 * 扫描目标目录中是否存在未授权的 ad-hoc 临时脚本
 */
export function findAdhocScriptsInDir(targetDir) {
  if (!targetDir || !fs.existsSync(targetDir)) return [];
  const entries = fs.readdirSync(targetDir, { withFileTypes: true });
  return entries
    .filter(e => e.isFile() && ADHOC_SCRIPT_EXT_RE.test(e.name))
    .map(e => e.name);
}

/**
 * 校验目标目录的血缘凭证完整性与防偷跑状态
 */
export function verifyProvenanceChain(targetDir, modelCode, {
  requiredPhases = ['PHASE_1_CONTEXT1', 'PHASE_2_CONTEXT2', 'PHASE_5_EXPORT']
} = {}) {
  const absDir = path.resolve(targetDir);
  const manifestPath = getManifestPath(absDir);
  const issues = [];

  if (!fs.existsSync(manifestPath)) {
    issues.push({
      ruleId: 'P0_PROVENANCE_CHAIN',
      severity: 'CRITICAL',
      title: '缺少标准流水线执行血缘凭证 (.run_manifest.json)',
      measuredDetail: `未在 ${absDir} 发现 ${PROVENANCE_MANIFEST_FILENAME}，疑似绕过标准入口自建脚本产出！`
    });
    return { ok: false, manifest: null, issues, adhocScripts: findAdhocScriptsInDir(absDir) };
  }

  let manifest = null;
  try {
    manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  } catch (err) {
    issues.push({
      ruleId: 'P0_PROVENANCE_CHAIN',
      severity: 'CRITICAL',
      title: '执行血缘凭证 JSON 解析失败',
      measuredDetail: err.message
    });
    return { ok: false, manifest: null, issues, adhocScripts: findAdhocScriptsInDir(absDir) };
  }

  if (!CANONICAL_ENTRYPOINTS.includes(manifest.entrypoint)) {
    issues.push({
      ruleId: 'P0_PROVENANCE_CHAIN',
      severity: 'CRITICAL',
      title: '血缘凭证入口不在受控白名单内',
      measuredDetail: `entrypoint="${manifest.entrypoint}"，仅允许: ${CANONICAL_ENTRYPOINTS.join(', ')}`
    });
  }

  if (modelCode && manifest.modelCode && manifest.modelCode !== modelCode) {
    issues.push({
      ruleId: 'P0_PROVENANCE_CHAIN',
      severity: 'CRITICAL',
      title: '血缘凭证产品型号与审计目标不一致',
      measuredDetail: `manifest.modelCode="${manifest.modelCode}" != "${modelCode}"`
    });
  }

  for (const ph of requiredPhases) {
    const rec = manifest.phases?.[ph];
    if (!rec || !rec.sha256) {
      issues.push({
        ruleId: 'P0_PROVENANCE_CHAIN',
        severity: 'CRITICAL',
        title: `缺失受控阶段血缘指纹 (${ph})`,
        measuredDetail: `阶段 ${ph} 未由标准流水线签发 SHA-256 指纹`
      });
    }
  }

  // 校验目录内全部 DOCX / PDF 交付物必须与凭证 SHA-256 100% 匹配
  const deliverableFiles = fs.existsSync(absDir)
    ? fs.readdirSync(absDir).filter(f => {
        if (!/\.(?:docx|pdf)$/i.test(f) || /_源文件留存\./i.test(f)) return false;
        if (manifest.sourcePath && path.resolve(absDir, f) === path.resolve(manifest.sourcePath)) return false;
        return true;
      })
    : [];

  if (deliverableFiles.length === 0) {
    issues.push({
      ruleId: 'P0_PROVENANCE_CHAIN',
      severity: 'FAIL',
      title: '交付目录未发现受控 DOCX/PDF 产物',
      measuredDetail: absDir
    });
  }

  for (const fileName of deliverableFiles) {
    const rec = manifest.deliverables?.[fileName];
    if (!rec || !rec.sha256) {
      issues.push({
        ruleId: 'P0_PROVENANCE_CHAIN',
        severity: 'CRITICAL',
        title: `交付物未登记至血缘账本: ${fileName}`,
        measuredDetail: `${fileName} 缺少受控流水线签发的 SHA-256 指纹，疑似手工或外部脚本生成`
      });
      continue;
    }
    const actualHash = sha256File(path.join(absDir, fileName));
    if (actualHash !== rec.sha256) {
      issues.push({
        ruleId: 'P0_PROVENANCE_CHAIN',
        severity: 'CRITICAL',
        title: `交付物 SHA-256 被外部篡改: ${fileName}`,
        measuredDetail: `预期 ${rec.sha256.slice(0, 12)}...，实测 ${actualHash.slice(0, 12)}...`
      });
    }
  }

  const adhocScripts = findAdhocScriptsInDir(absDir);
  if (adhocScripts.length > 0) {
    issues.push({
      ruleId: 'P0_NO_ADHOC_SCRIPTS',
      severity: 'CRITICAL',
      title: '交付目录检测到未授权的 ad-hoc 临时脚本',
      measuredDetail: `发现禁止的脚本文件: ${adhocScripts.join(', ')}`
    });
  }

  return {
    ok: issues.length === 0,
    manifest,
    issues,
    adhocScripts
  };
}
