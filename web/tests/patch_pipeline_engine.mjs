import fs from 'node:fs';

const filePath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/pipeline-engine.js';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Update imports
const oldImportPrimitives = `import {
  MSDS_DESIGN_TOKENS,
  applyGlobalTypographyProjection
} from './universal-editor-primitives.js';`;

const newImportPrimitives = `import {
  MSDS_DESIGN_TOKENS,
  applyGlobalTypographyProjection,
  bindEntityPresetToDocument
} from './universal-editor-primitives.js';
import { getPresetById, listPresets, getDefaultPreset } from './msds-db.js';`;

if (!content.includes(oldImportPrimitives)) {
  throw new Error('oldImportPrimitives not found in pipeline-engine.js');
}

content = content.replace(oldImportPrimitives, newImportPrimitives);

// 2. Build resolvePreset and executeAdaptiveDeliverablesPipeline
const adaptivePipelineCode = `
/**
 * 智能解析企业预设实体 (从 DB、内置矩阵或传入对象中解析标准模型)
 */
async function resolvePresetEntity(presetOrId) {
  if (typeof presetOrId === 'object' && presetOrId !== null) {
    return presetOrId;
  }
  const idStr = String(presetOrId || '').trim();
  if (!idStr) return null;

  // 1. 优先从 SQLite 数据库查询
  try {
    const dbPreset = getPresetById(idStr);
    if (dbPreset) return dbPreset;
  } catch (e) {}

  // 2. 匹配内置企业矩阵 ENTITY_MATRIX
  const key = idStr.replace(/^preset_/, '').replace(/_(?:cn|en)$/i, '').toUpperCase();
  if (ENTITY_MATRIX[key]) {
    const em = ENTITY_MATRIX[key];
    return {
      id: \`preset_\${key.toLowerCase()}\`,
      name: em.cn.name,
      isBuiltin: true,
      entityData: {
        name_zh: em.cn.name,
        name_en: em.en.name,
        shortName_zh: em.cn.shortName,
        shortName_en: em.en.shortName,
        address_zh: em.cn.address,
        address_en: em.en.address,
        tel: em.cn.tel,
        fax: em.cn.fax,
        emergencyTel_zh: em.cn.tel,
        emergencyTel_en: em.en.tel
      }
    };
  }

  // 3. 遍历数据库所有预设做模糊/名称匹配
  try {
    const all = listPresets();
    const found = all.find(p => p.id === idStr || p.name === idStr);
    if (found) return found;
  } catch (e) {}

  return null;
}

/**
 * 自适应多格式流水线引擎 (Adaptive Deliverables Pipeline)
 * 彻底打破硬编码双主体(冠志/国彩)与固定 8 格式枷锁，
 * 根据传入的 Presets × Languages × Formats 动态计算笛卡尔积并精准交付！
 *
 * @param {Object} options
 * @param {string} options.modelCode - 产品型号代码 (如 "PA-3655")
 * @param {string} [options.cnGroundTruthPath] - 中文源文件物理路径
 * @param {ArrayBuffer} [options.cnGroundTruthBuffer] - 中文源文件内存 Buffer
 * @param {Array<string|Object>} [options.presetIds] - 预设 ID 列表或实体对象列表
 * @param {Array<string>} [options.languages] - 目标语言列表 (如 ['CN', 'EN'] 或 ['CN'] 或 ['EN'])
 * @param {Array<string>} [options.formats] - 交付格式列表 (如 ['docx', 'pdf'] 或 ['docx'] 或 ['pdf'])
 * @param {string} [options.targetDir] - 导出物理目录
 * @param {Object} [options.facts] - 提取或覆写的事实参数
 * @param {string} [options.revisionDate] - 修订日期覆写
 * @returns {Promise<Object>} { success, model, targetDir, totalFiles, deliverables }
 */
export async function executeAdaptiveDeliverablesPipeline({
  modelCode,
  cnGroundTruthPath = null,
  cnGroundTruthBuffer = null,
  presetIds = ['preset_guanzhi_cn', 'preset_guocai_cn'],
  languages = ['CN', 'EN'],
  formats = ['docx', 'pdf'],
  targetDir = null,
  facts = {},
  revisionDate = null
}) {
  const startTime = Date.now();
  const preservedFiles = [];

  if (!modelCode) {
    throw new Error('【流水线致命拦截】缺少必需的 modelCode 型号参数！');
  }

  // 0. 源文件绝对无损安全留存防御
  if (cnGroundTruthPath) {
    const docxBackup = await preserveOriginalFileBackup(cnGroundTruthPath);
    if (docxBackup) preservedFiles.push(docxBackup);

    const ext = path.extname(cnGroundTruthPath);
    const dir = path.dirname(cnGroundTruthPath);
    const base = path.basename(cnGroundTruthPath, ext);
    const pdfBackup = await preserveOriginalFileBackup(path.join(dir, \`\${base}.pdf\`));
    if (pdfBackup) preservedFiles.push(pdfBackup);
  }

  // 1. 标准化请求参数与笛卡尔积维度
  const rawLangs = Array.isArray(languages) && languages.length > 0 ? languages : ['CN', 'EN'];
  const normLangs = [...new Set(rawLangs.map(l => String(l).toUpperCase().replace('ZH', 'CN')))].filter(l => l === 'CN' || l === 'EN');
  if (normLangs.length === 0) normLangs.push('CN', 'EN');

  const rawFormats = Array.isArray(formats) && formats.length > 0 ? formats : ['docx', 'pdf'];
  const normFormats = [...new Set(rawFormats.map(f => String(f).toLowerCase()))].filter(f => f === 'docx' || f === 'pdf');
  if (normFormats.length === 0) normFormats.push('docx', 'pdf');

  // 解析并去重目标预设列表
  const rawPresetIds = Array.isArray(presetIds) && presetIds.length > 0 ? presetIds : ['preset_guanzhi_cn', 'preset_guocai_cn'];
  const resolvedPresets = [];
  const seenPresetIds = new Set();

  for (const pid of rawPresetIds) {
    const p = await resolvePresetEntity(pid);
    if (p && !seenPresetIds.has(p.id)) {
      seenPresetIds.add(p.id);
      resolvedPresets.push(p);
    } else if (!p) {
      console.warn(\`[AdaptivePipeline] 无法找到匹配企业预设: \${pid}，跳过\`);
    }
  }

  if (resolvedPresets.length === 0) {
    const fallbackPreset = await resolvePresetEntity('GUANZHI');
    if (fallbackPreset) resolvedPresets.push(fallbackPreset);
  }

  // 2. 建立中文基准引擎 (Base Chinese Engine 作为全书单一事实真理源)
  const baseCnEngine = await buildBaseChineseEngine({
    modelCode,
    cnGroundTruthPath,
    cnGroundTruthBuffer,
    revisionDate,
    viscosityOverride: facts.viscosityOverride || facts.viscosity,
    facts
  });

  const todayDateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '/');
  const isOutdated = !baseCnEngine._adaptiveRevisionDate || 
    baseCnEngine._adaptiveRevisionDate.startsWith('2023') || 
    baseCnEngine._adaptiveRevisionDate.startsWith('2024') || 
    baseCnEngine._adaptiveRevisionDate.startsWith('2025');
  const effectiveDate = revisionDate || (!isOutdated ? baseCnEngine._adaptiveRevisionDate : todayDateStr);

  // 3. 按需建立英文基准引擎 (Base English Engine)
  let baseEnEngine = null;
  if (normLangs.includes('EN')) {
    baseEnEngine = await buildBaseEnglishEngine({
      modelCode,
      baseCnEngine,
      facts,
      revisionDate: effectiveDate
    });
    // 中英文事实一致性交叉质检门禁
    assertBilingualIntegrity(baseCnEngine, baseEnEngine);
  }

  // 4. 探知说明行数量并准备硬性质量门禁事实
  const s12RecordForAudit = baseCnEngine.records.find(r => r.sectionNumber === 12);
  let expectedS12PreamblesCount = 0;
  if (s12RecordForAudit) {
    for (let i = 1; i < s12RecordForAudit.rows.length; i++) {
      const row = s12RecordForAudit.rows[i];
      if (row.cells.length > 1) break;
      const t = row.cells.map(c => c.text || '').join('').trim();
      if (/生态毒性|持久性|12\\.\\d/i.test(t)) break;
      if (t) expectedS12PreamblesCount++;
    }
  }

  const s11RecordForAudit = baseCnEngine.records.find(r => r.sectionNumber === 11);
  let expectedS11PreamblesCount = 0;
  if (s11RecordForAudit) {
    for (let i = 1; i < s11RecordForAudit.rows.length; i++) {
      const t = s11RecordForAudit.rows[i].cells.map(c => c.text || '').join('').trim();
      if (/急性毒性|原发性皮肤刺激|主要皮肤刺激|11\\.\\d|毒性[:：]|Toxicity[:：]|羟基|Hydroxy|二乙二醇|丙二醇|Propylene/i.test(t)) break;
      if (t) expectedS11PreamblesCount++;
    }
  }

  const isNonHazardousComposite = Boolean(facts.isNonHazardousComposite || detectNonHazardousComposite(baseCnEngine.records, facts));
  const sourceFactsForAudit = {
    expectedS11PreamblesCount,
    expectedS12PreamblesCount,
    expectedDate: effectiveDate,
    isNonHazardousComposite
  };

  // 5. 动态装配 Presets × Languages 各变体引擎
  const generatedVariants = [];

  for (const preset of resolvedPresets) {
    const entityData = preset.entityData || preset.entity || preset;

    // A. 派生装配中文版
    if (normLangs.includes('CN')) {
      const companyNameZh = entityData.name_zh || preset.name_zh || preset.name;
      const shortNameZh = entityData.shortName_zh || preset.shortName_zh || preset.shortName || companyNameZh;
      const fileName = \`\${modelCode} msds_CN \${shortNameZh}.docx\`;

      const cnBuf = await baseCnEngine.exportArrayBuffer();
      const eng = await loadDocx(cnBuf, fileName);

      bindEntityPresetToDocument(eng, preset, { isEnglish: false, modelCode, revisionDate: effectiveDate });
      updateHeaderFooterData(eng, {
        model: modelCode,
        company: companyNameZh,
        title: '物料安全数据表',
        version: 'V1.0',
        docCode: \`\${modelCode}-MSDS\`,
        revisionDate: effectiveDate,
        language: 'CN',
        entity: shortNameZh
      });

      for (const record of eng.records) {
        if (record.kind === 'table') enforceTableStandardBorders(record);
      }
      if (eng.documentXml) enableCrossPageBreaksForAllSections(eng);
      applyGlobalTypographyProjection(eng, false);
      enforceStructuralTypographyInvariants(eng, false);

      const s8Rec = eng.records.find(r => r.sectionNumber === 8);
      if (s8Rec) {
        const handRowCn = s8Rec.rows.find(row => /手部防护/i.test(row.cells[0]?.text || ''));
        if (handRowCn && handRowCn.cells[0]?.node) {
          const c0 = handRowCn.cells[0].node;
          const inds = Array.from(c0.getElementsByTagNameNS(W_NS, 'ind'));
          inds.forEach(ind => {
            ind.setAttribute('w:left', '420');
            ind.removeAttribute('w:firstLine');
            ind.removeAttribute('w:firstLineChars');
            ind.removeAttribute('w:hanging');
            ind.removeAttribute('w:hangingChars');
            ind.removeAttribute('w:leftChars');
            ind.removeAttributeNS(W_NS, 'leftChars');
            ind.setAttributeNS(W_NS, 'w:leftChars', '0');
          });
        }
      }

      const s9 = eng.records.find(r => r.sectionNumber === 9);
      if (s9) renumberRecord(s9);
      const s10 = eng.records.find(r => r.sectionNumber === 10);
      if (s10) renumberRecord(s10);

      enforceGlobalLeftAlignmentAndCleanIndent(eng, false);
      assertDeliverableQuality(eng, fileName, false, sourceFactsForAudit);

      generatedVariants.push({
        eng,
        fileName,
        lang: 'CN',
        preset,
        shortName: shortNameZh
      });
    }

    // B. 派生装配英文版
    if (normLangs.includes('EN') && baseEnEngine) {
      const companyNameEn = entityData.name_en || preset.name_en || preset.name;
      const shortNameEn = entityData.shortName_en || preset.shortName_en || preset.shortName || companyNameEn;
      const fileName = \`\${modelCode} msds_EN \${shortNameEn}.docx\`;

      const enBuf = await baseEnEngine.exportArrayBuffer();
      const eng = await loadDocx(enBuf, fileName);

      bindEntityPresetToDocument(eng, preset, { isEnglish: true, modelCode, revisionDate: effectiveDate });
      updateHeaderFooterData(eng, {
        model: modelCode,
        company: companyNameEn,
        title: 'MATERIAL SAFETY DATA SHEET',
        version: 'V1.0',
        docCode: \`\${modelCode}-MSDS\`,
        revisionDate: effectiveDate,
        language: 'EN',
        entity: shortNameEn
      });

      standardizeEnglishTypographyAndLabels(eng);
      const s9 = eng.records.find(r => r.sectionNumber === 9);
      if (s9) renumberRecord(s9);

      for (const record of eng.records) {
        if (record.kind === 'table') enforceTableStandardBorders(record);
      }
      if (eng.documentXml) enableCrossPageBreaksForAllSections(eng);
      applyGlobalTypographyProjection(eng, true);
      enforceStructuralTypographyInvariants(eng, true);

      const s13Rec = eng.records.find(r => r.sectionNumber === 13);
      if (s13Rec) {
        for (const row of s13Rec.rows) {
          for (const cell of row.cells) {
            if (cell?.node) {
              const jcs = Array.from(cell.node.getElementsByTagNameNS(W_NS, 'jc'));
              for (const jc of jcs) {
                if (jc.getAttribute('w:val') === 'both') {
                  jc.setAttribute('w:val', 'left');
                }
              }
            }
          }
        }
      }

      const s10 = eng.records.find(r => r.sectionNumber === 10);
      if (s10) renumberRecord(s10);

      enforceGlobalLeftAlignmentAndCleanIndent(eng, true);
      assertZeroChinese(eng, fileName);
      assertDeliverableQuality(eng, fileName, true, sourceFactsForAudit);

      generatedVariants.push({
        eng,
        fileName,
        lang: 'EN',
        preset,
        shortName: shortNameEn
      });
    }
  }

  // 6. 批量极速写入与并行 PDF 转换
  if (targetDir) {
    await fs.mkdir(targetDir, { recursive: true });
  }

  const results = [];
  const convertInputs = [];

  for (const variant of generatedVariants) {
    const buf = await variant.eng.exportArrayBuffer();
    const docxPath = targetDir ? path.join(targetDir, variant.fileName) : null;
    if (docxPath && normFormats.includes('docx')) {
      await safeWriteFileWithLockGuard(docxPath, Buffer.from(buf));
    }

    if (normFormats.includes('docx')) {
      results.push({
        name: variant.fileName,
        format: 'docx',
        size: buf.byteLength,
        path: docxPath,
        lang: variant.lang,
        presetId: variant.preset.id
      });
    }

    if (normFormats.includes('pdf')) {
      convertInputs.push({
        docxBuffer: buf,
        fileName: variant.fileName,
        lang: variant.lang,
        presetId: variant.preset.id
      });
    }
  }

  // 批量高速无头转译 PDF (如果请求了 pdf)
  if (convertInputs.length > 0) {
    const pdfOutputs = await convertBatchDocxToPdf(convertInputs.map(ci => ({
      docxBuffer: ci.docxBuffer,
      fileName: ci.fileName
    })));

    for (let i = 0; i < pdfOutputs.length; i++) {
      const p = pdfOutputs[i];
      const ci = convertInputs[i];
      const finalPdfPath = targetDir ? path.join(targetDir, p.pdfName) : null;
      if (finalPdfPath && p.pdfBuffer) {
        await safeWriteFileWithLockGuard(finalPdfPath, p.pdfBuffer);
      }
      results.push({
        name: p.pdfName,
        format: 'pdf',
        size: p.size,
        durationMs: p.durationMs,
        path: finalPdfPath,
        lang: ci?.lang || (p.pdfName.includes('_EN') ? 'EN' : 'CN'),
        presetId: ci?.presetId || null
      });
    }
  }

  // 交付目录绝对纯净清场：清理非标准历史碎片
  if (targetDir) {
    try {
      const canonicalNames = new Set(results.map(r => r.name));
      const dirEntries = await fs.readdir(targetDir, { withFileTypes: true });
      for (const entry of dirEntries) {
        if (entry.isFile()) {
          const fileName = entry.name;
          if (!canonicalNames.has(fileName)) {
            if (fileName.includes('_源文件留存') || fileName.includes('_原版留存')) {
              const archiveSubdir = path.join(targetDir, '源文件留存');
              await fs.mkdir(archiveSubdir, { recursive: true }).catch(() => {});
              await fs.rename(path.join(targetDir, fileName), path.join(archiveSubdir, fileName)).catch(() => {});
              console.log(\`[CleanSweep] 安全归档源文件留存至子目录: \${fileName} -> 源文件留存/\`);
            } else if (
              fileName.includes('(最新)') ||
              fileName.includes('(更新)') ||
              fileName.includes('(临时更新)') ||
              fileName.includes('手做改版材料') ||
              fileName.includes('当前匹配结果')
            ) {
              await fs.unlink(path.join(targetDir, fileName)).catch(() => {});
              console.log(\`[CleanSweep] 清除交付目录非标准历史碎片: \${fileName}\`);
            }
          }
        }
      }
    } catch (cleanErr) {
      console.warn(\`[CleanSweep] 清场异常: \${cleanErr.message}\`);
    }
  }

  // Gate 12: 双极双层深度审计 (当生成了标准的 8 交付物时执行全景审计)
  if (targetDir && results.length === 8 && results.every(r => r.name.includes('冠志') || r.name.includes('Guanzhi') || r.name.includes('国彩') || r.name.includes('Guocai'))) {
    try {
      const auditModule = await import('../scripts/audit_bipolar_bilayer.mjs');
      if (auditModule?.runBipolarBilayerAudit) {
        const auditRes = await auditModule.runBipolarBilayerAudit(targetDir, modelCode);
        if (!auditRes.success) {
          throw new Error(\`【质量门禁拦截 (Gate 12)】\${modelCode} 产出物双极双层全景深度审计未通过，存在 \${auditRes.failCount} 项严重违章！立即阻断交付。\`);
        }
      }
    } catch (auditErr) {
      if (auditErr.message?.includes('质量门禁拦截')) throw auditErr;
      console.warn(\`[Pipeline] 深度审计模块执行提示: \${auditErr.message}\`);
    }
  }

  return {
    success: true,
    model: modelCode,
    targetDir,
    totalFiles: results.length,
    durationMs: Date.now() - startTime,
    preservedFiles,
    deliverables: results
  };
}
`;

// 3. Locate executeEightDeliverablesPipeline and replace it with adaptive wrapper + delegate
const targetHeader = `export async function executeEightDeliverablesPipeline({`;
const idxExec = content.indexOf(targetHeader);
if (idxExec === -1) {
  throw new Error('executeEightDeliverablesPipeline not found in pipeline-engine.js');
}

// Find the end of executeEightDeliverablesPipeline
// It ends right before enforceStructuralTypographyInvariants
const targetNextFunc = `export function enforceStructuralTypographyInvariants(eng, isEn = false) {`;
const idxNext = content.indexOf(targetNextFunc, idxExec);
if (idxNext === -1) {
  throw new Error('enforceStructuralTypographyInvariants not found after executeEightDeliverablesPipeline');
}

const newEightDeliverablesWrapper = `
/**
 * 门面接口：四阶流水线一步原子完成 (向后兼容经典 8 格式门面)
 */
export async function executeEightDeliverablesPipeline({
  modelCode,
  cnGroundTruthPath,
  cnGroundTruthBuffer,
  targetDir,
  facts = {},
  revisionDate = null
}) {
  return executeAdaptiveDeliverablesPipeline({
    modelCode,
    cnGroundTruthPath,
    cnGroundTruthBuffer,
    targetDir,
    presetIds: ['preset_guanzhi_cn', 'preset_guocai_cn'],
    languages: ['CN', 'EN'],
    formats: ['docx', 'pdf'],
    facts,
    revisionDate
  });
}

`;

const finalContent = content.slice(0, idxExec) + adaptivePipelineCode + newEightDeliverablesWrapper + content.slice(idxNext);

fs.writeFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/tests/proposed_pipeline_engine.js', finalContent, 'utf8');
console.log('Successfully generated proposed_pipeline_engine.js!');
