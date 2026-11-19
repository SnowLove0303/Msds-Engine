import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html><body></body></html>');
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '../..');

const {
  buildBaseChineseEngine,
  buildBaseEnglishEngine,
  enforceStructuralTypographyInvariants,
  enforceGlobalLeftAlignmentAndCleanIndent,
  assertDeliverableQuality,
  standardizeEnglishTypographyAndLabels,
  assertZeroChinese
} = await import('../src/pipeline-engine.js');

const {
  loadDocx,
  deleteRow,
  writeCellValue,
  updateHeaderFooterData,
  enforceTableStandardBorders,
  enableCrossPageBreaksForAllSections,
  renumberRecord
} = await import('../src/docx-engine.js');

const {
  bindEntityPresetToDocument,
  applyGlobalTypographyProjection
} = await import('../src/universal-editor-primitives.js');

const { getPresetById } = await import('../src/msds-db.js');
const { convertBatchDocxToPdf } = await import('../src/pdf-converter.js');
const { runBipolarBilayerAudit } = await import('./audit_bipolar_bilayer.mjs');
const { runMasterMsdsAudit } = await import('./run_master_msds_audit.mjs');

const modelCode = 'EP-1501';
const sourcePath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料/4-1 水性环氧树脂 EP/EP-1501/EP-1501msds_CN 冠志.docx';
const targetDir = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/04-1 水性环氧树脂 EP/EP-1501/测试产出';

const W_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';

/**
 * 紧凑化 Section 2 (危险性概述 / Hazards Identification) 内容与标签间距
 * 将原本约两行空行 (480 dxa / 24pt) 压缩为紧实的一行空行 (约 220 dxa / 11pt)
 * 1. 单元格上下边距: w:top="60" dxa, w:bottom="60" dxa (共 120 dxa = 6pt)
 * 2. 节标题起始段前间距: w:before="100" dxa (5pt)
 * 垂直总间隙 = 60 + 60 + 100 = 220 dxa (11pt，恰好一行紧凑空行)
 */
function compactSection2Spacing(eng) {
  const s2 = eng.records.find(r => r.sectionNumber === 2);
  if (!s2 || !s2.rows) return;

  for (let rIdx = 1; rIdx < s2.rows.length; rIdx++) {
    const row = s2.rows[rIdx];
    if (!row.node) continue;

    // A. 紧凑化单元格上下内边距 (top=60, bottom=60)
    const tcPr = row.node.getElementsByTagNameNS(W_NS, 'tcPr')[0];
    if (tcPr) {
      let tcMar = tcPr.getElementsByTagNameNS(W_NS, 'tcMar')[0];
      if (!tcMar) {
        tcMar = row.node.ownerDocument.createElementNS(W_NS, 'w:tcMar');
        tcPr.appendChild(tcMar);
      }
      let top = tcMar.getElementsByTagNameNS(W_NS, 'top')[0];
      if (!top) {
        top = row.node.ownerDocument.createElementNS(W_NS, 'w:top');
        tcMar.appendChild(top);
      }
      top.setAttributeNS(W_NS, 'w:w', '60');
      top.setAttributeNS(W_NS, 'w:type', 'dxa');

      let bottom = tcMar.getElementsByTagNameNS(W_NS, 'bottom')[0];
      if (!bottom) {
        bottom = row.node.ownerDocument.createElementNS(W_NS, 'w:bottom');
        tcMar.appendChild(bottom);
      }
      bottom.setAttributeNS(W_NS, 'w:w', '60');
      bottom.setAttributeNS(W_NS, 'w:type', 'dxa');
    }

    // B. 紧凑化主要节标题 (2.2, 2.3, 2.4, 2.5) 段前间距 (before=100)
    const ps = Array.from(row.node.getElementsByTagNameNS(W_NS, 'p'));
    for (const p of ps) {
      const text = (p.textContent || '').trim();
      if (/^(?:2\.[2-9]|(?:2\.\d+\s*)?(?:(?:GHS\s*)?标签要素|Label elements|GHS Label Elements|危险性说明|Hazard statements?|防范说明|Precautionary statements?|其他危害|其他危险|Other\s*Hazards?))/i.test(text)) {
        let pPr = p.getElementsByTagNameNS(W_NS, 'pPr')[0];
        if (!pPr) {
          pPr = row.node.ownerDocument.createElementNS(W_NS, 'w:pPr');
          p.insertBefore(pPr, p.firstChild);
        }
        let spacing = pPr.getElementsByTagNameNS(W_NS, 'spacing')[0];
        if (!spacing) {
          spacing = row.node.ownerDocument.createElementNS(W_NS, 'w:spacing');
          pPr.appendChild(spacing);
        }
        spacing.setAttributeNS(W_NS, 'w:before', '100');
      }
    }
  }
}

async function main() {
  console.log('========================================================================');
  console.log(`  EP-1501 全套 8 格式标准受控交付物生产流水线 (Seven-Step SOP)`);
  console.log(`  源文件: ${sourcePath}`);
  console.log(`  目标目录: ${targetDir}`);
  console.log('========================================================================\n');

  if (!fsSync.existsSync(sourcePath)) {
    throw new Error(`源文件不存在: ${sourcePath}`);
  }
  await fs.mkdir(targetDir, { recursive: true });

  const srcBuf = await fs.readFile(sourcePath);
  const facts = {
    modelCode,
    isHazardous: true,
    isDangerousGoods: false
  };

  // 1. 建立中文基准引擎
  console.log('>>> [Step 1] 建立中文基准引擎 (Base Chinese Engine)...');
  const baseCnEngine = await buildBaseChineseEngine({
    modelCode,
    sourceDocxBuffer: srcBuf,
    facts
  });

  const todayDateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '/');
  const isOutdated = !baseCnEngine._adaptiveRevisionDate || 
    baseCnEngine._adaptiveRevisionDate.startsWith('2023') || 
    baseCnEngine._adaptiveRevisionDate.startsWith('2024') || 
    baseCnEngine._adaptiveRevisionDate.startsWith('2025');
  const effectiveDate = !isOutdated ? baseCnEngine._adaptiveRevisionDate : todayDateStr;

  // 2. 局部规范强化与防污染治理
  console.log('>>> [Step 2] 执行 Section 1、Section 2 与 Section 11 规范强化...');
  
  // Section 1 规范治理：
  // Row 1 题头 (1.1 产品名称：) 值格必须留空，防止污染
  // Row 2 中文名称： 值格注入 '水性环氧乳液 EP-1501'
  // Row 3 化学品分类： 值格注入 '环氧水分散体'
  const s1Cn = baseCnEngine.records.find(r => r.sectionNumber === 1);
  if (s1Cn && s1Cn.rows.length >= 4) {
    // Row 1: 1.1 产品名称： (值格置空)
    if (s1Cn.rows[1]?.cells?.[1]) {
      writeCellValue(s1Cn.rows[1].cells[1], '');
    }
    // Row 2: 中文名称：
    if (s1Cn.rows[2]?.cells?.[1]) {
      writeCellValue(s1Cn.rows[2].cells[1], '水性环氧乳液 EP-1501');
    }
    // Row 3: 化学品分类：
    if (s1Cn.rows[3]?.cells?.[1]) {
      writeCellValue(s1Cn.rows[3].cells[1], '环氧水分散体');
    }
  }

  // Section 2 间距紧凑化治理
  compactSection2Spacing(baseCnEngine);

  // Section 11 规范治理：
  // EP-1501 无毒理学终点，仅有单行免责说明行，剪除模板残留的 11.1 / 11.2 / 11.3 幽灵行
  let s11Cn = baseCnEngine.records.find(r => r.sectionNumber === 11);
  if (s11Cn) {
    while (s11Cn.rows.length > 2) {
      s11Cn = deleteRow(baseCnEngine, s11Cn, s11Cn.rows.length - 1);
    }
  }
  baseCnEngine.refresh();

  // 3. 建立英文基准引擎
  console.log('>>> [Step 3] 建立英文基准引擎 (Base English Engine)...');
  const baseEnEngine = await buildBaseEnglishEngine({
    modelCode,
    baseCnEngine,
    facts,
    revisionDate: effectiveDate
  });
  compactSection2Spacing(baseEnEngine);

  // 4. 动态探知说明行数量并准备硬性质量门禁事实
  const s12RecordForAudit = baseCnEngine.records.find(r => r.sectionNumber === 12);
  let expectedS12PreamblesCount = 0;
  if (s12RecordForAudit) {
    for (let i = 1; i < s12RecordForAudit.rows.length; i++) {
      const t = s12RecordForAudit.rows[i].cells.map(c => c.text || '').join('').trim();
      if (/生态毒性|持久性|Ecotoxicity|Persistence|12\.\d/i.test(t)) break;
      if (t) expectedS12PreamblesCount++;
    }
  }

  const s11RecordForAudit = baseCnEngine.records.find(r => r.sectionNumber === 11);
  let expectedS11PreamblesCount = 0;
  if (s11RecordForAudit) {
    for (let i = 1; i < s11RecordForAudit.rows.length; i++) {
      const t = s11RecordForAudit.rows[i].cells.map(c => c.text || '').join('').trim();
      if (/急性毒性|原发性皮肤刺激|主要皮肤刺激|11\.\d|毒性[:：]|Toxicity[:：]|羟基|Hydroxy|二乙二醇|丙二醇|Propylene/i.test(t)) break;
      if (t) expectedS11PreamblesCount++;
    }
  }

  const sourceFactsForAudit = {
    expectedS11PreamblesCount,
    expectedS12PreamblesCount,
    expectedDate: effectiveDate,
    isNonHazardousComposite: false
  };

  // 5. 动态装配 Presets × Languages 各变体引擎 (4 DOCX)
  console.log('>>> [Step 4] 派生并装配 4 格式 DOCX (冠志/国彩 × 中/英)...');
  const resolvedPresets = [
    await getPresetById('preset_guanzhi_cn'),
    await getPresetById('preset_guocai_cn')
  ];

  const generatedVariants = [];

  for (const preset of resolvedPresets) {
    const entityData = preset.entityData || preset.entity || preset;

    // A. 派生装配中文版
    {
      const companyNameZh = entityData.name_zh || preset.name_zh || preset.name;
      const shortNameZh = entityData.shortName_zh || preset.shortName_zh || preset.shortName || companyNameZh;
      const fileName = `${modelCode} msds_CN ${shortNameZh}.docx`;

      const cnBuf = await baseCnEngine.exportArrayBuffer();
      const eng = await loadDocx(cnBuf, fileName);

      bindEntityPresetToDocument(eng, preset, { isEnglish: false, modelCode, revisionDate: effectiveDate });
      updateHeaderFooterData(eng, {
        model: modelCode,
        company: companyNameZh,
        title: '物料安全数据表',
        version: 'V1.0',
        docCode: `${modelCode}-MSDS`,
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
      compactSection2Spacing(eng);

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
    {
      const companyNameEn = entityData.name_en || preset.name_en || preset.name;
      const shortNameEn = entityData.shortName_en || preset.shortName_en || preset.shortName || companyNameEn;
      const fileName = `${modelCode} msds_EN ${shortNameEn}.docx`;

      const enBuf = await baseEnEngine.exportArrayBuffer();
      const eng = await loadDocx(enBuf, fileName);

      bindEntityPresetToDocument(eng, preset, { isEnglish: true, modelCode, revisionDate: effectiveDate });
      updateHeaderFooterData(eng, {
        model: modelCode,
        company: companyNameEn,
        title: 'MATERIAL SAFETY DATA SHEET',
        version: 'V1.0',
        docCode: `${modelCode}-MSDS`,
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
      compactSection2Spacing(eng);

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

  // 6. 写入 4 个 DOCX
  console.log('>>> [Step 5] 写入 4 个 DOCX 交付物至目标目录...');
  const convertInputs = [];
  for (const v of generatedVariants) {
    const buf = await v.eng.exportArrayBuffer();
    const docxPath = path.join(targetDir, v.fileName);
    await fs.writeFile(docxPath, Buffer.from(buf));
    console.log(`   - 已写入: ${v.fileName} (${buf.byteLength} 字节)`);
    convertInputs.push({
      docxBuffer: buf,
      fileName: v.fileName,
      lang: v.lang,
      presetId: v.preset.id
    });
  }

  // 7. 批量 Windows COM WPS/Word 转换为 4 个 PDF
  console.log('\n>>> [Step 6] 启动 Windows COM WPS/Word 批处理转换 4 个 PDF...');
  const pdfOutputs = await convertBatchDocxToPdf(convertInputs.map(ci => ({
    docxBuffer: ci.docxBuffer,
    fileName: ci.fileName
  })));

  for (let i = 0; i < pdfOutputs.length; i++) {
    const p = pdfOutputs[i];
    const finalPdfPath = path.join(targetDir, p.pdfName);
    if (p.pdfBuffer) {
      await fs.writeFile(finalPdfPath, p.pdfBuffer);
      console.log(`   - 已生成 PDF: ${p.pdfName} (${p.size} 字节, ${p.durationMs}ms)`);
    }
  }

  // 8. 清理交付目录中非标准文件
  const canonicalNames = new Set([
    ...generatedVariants.map(v => v.fileName),
    ...pdfOutputs.map(p => p.pdfName)
  ]);
  const dirEntries = await fs.readdir(targetDir, { withFileTypes: true });
  for (const entry of dirEntries) {
    if (entry.isFile()) {
      const fileName = entry.name;
      if (!canonicalNames.has(fileName) && !fileName.endsWith('.md')) {
        await fs.unlink(path.join(targetDir, fileName)).catch(() => {});
        console.log(`[CleanSweep] 清理非标准临时文件: ${fileName}`);
      }
    }
  }

  const allFiles = (await fs.readdir(targetDir)).filter(f => /msds/i.test(f) && (f.endsWith('.docx') || f.endsWith('.pdf')));
  console.log(`\n>>> [DELIVERY] 目标目录实测 MSDS 交付物总数: ${allFiles.length} 个`);
  allFiles.forEach(f => console.log(`   * ${f}`));
  if (allFiles.length !== 8) {
    throw new Error(`交付物数量异常: 实测 ${allFiles.length} 项 (期望 8 项)`);
  }

  // 9. 执行双极双层深度审计
  console.log('\n========================================================================');
  console.log('>>> [Step 7] 启动双极双层全景法医级机械深度审计 (Bipolar Bilayer Audit)...');
  console.log('========================================================================');
  const auditRes = await runBipolarBilayerAudit(targetDir, modelCode);
  console.log('\n>>> [AUDIT] 审计结论:', auditRes);
  if (!auditRes.success) {
    throw new Error(`双极双层深度审计未通过，存在 ${auditRes.failCount} 项严重违章！`);
  }

  // 10. 执行 Master MSDS 全要素双轨深度对账审计
  console.log('\n========================================================================');
  console.log('>>> [Step 8] 启动 Master MSDS 全要素双轨深度对账审计 (Master MSDS Audit)...');
  console.log('========================================================================');
  const masterAuditRes = await runMasterMsdsAudit({
    model: modelCode,
    targetDir,
    sourceDocx: sourcePath
  });
  console.log('\n>>> [MASTER AUDIT] 审计结论:', masterAuditRes);
  if (!masterAuditRes.success) {
    throw new Error(`Master MSDS 深度审计未通过，存在 ${masterAuditRes.failCount} 项严重违章！`);
  }

  console.log('\n🎉🎉🎉 [SUCCESS] EP-1501 标准 8 格式全套交付物生产完毕，并 100% 满分通过双极双层与 Master MSDS 机械审计！');
}

main().catch(err => {
  console.error('\n❌ [ERROR] 生成与审计过程中断:', err);
  process.exit(1);
});
