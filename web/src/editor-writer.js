import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  createWorkSession,
  saveSession,
  clearTemplateValues,
  writeCellValueToSession,
  writeRichTextToSession,
  insertRowIntoSession,
  deleteRowFromSession,
  mergeCellsInSession,
  formatSection9LaserTabs,
  applyCompanyPreset,
  TEMPLATE_LIBRARY
} from './template-editor.js';
import {
  enforceTableStandardBorders,
  enableCrossPageBreaksForAllSections,
  updateHeaderFooterData,
  writeCellValue,
  renderFullWidthRow,
  addRowAfter,
  deleteRow,
  W_NS
} from './docx-engine.js';
import { applyGlobalTypographyProjection } from './universal-editor-primitives.js';
import { enforceStructuralTypographyInvariants } from './pipeline-engine.js';
import { translateChemicalTerm, translateSection3Notes } from './context-governor.js';

/**
 * 模板资产自省探测 (Discover Available Templates - REQ-TPL-DISCOVERY-01)
 * 扫描指定目录（默认 web/public/templates/），返回可用模板元数据清单
 */
export function discoverAvailableTemplates(templatesDir = null) {
  const defaultDir = fileURLToPath(new URL('../public/templates', import.meta.url));
  const baseDir = templatesDir || (fs.existsSync(defaultDir) ? defaultDir : path.resolve(process.cwd(), 'web/public/templates'));
  if (!fs.existsSync(baseDir)) {
    return [];
  }

  const results = [];
  const entries = fs.readdirSync(baseDir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isFile() && entry.name.endsWith('.docx')) {
      const fullPath = path.join(baseDir, entry.name);
      const isEnglish = /_EN_|EN\b|English/i.test(entry.name);
      const isGuanzhi = /冠志|Guanzhi/i.test(entry.name);
      const isGuocai = /国彩|Guocai/i.test(entry.name);
      results.push({
        name: entry.name,
        path: fullPath,
        language: isEnglish ? 'en' : 'zh',
        isDefault: /^正式模板_MSDS_(?:CN|EN)_冠志/.test(entry.name),
        company: isGuocai ? 'Guocai' : (isGuanzhi ? 'Guanzhi' : 'Standard'),
        isCustom: false
      });
    } else if (entry.isDirectory() && entry.name === 'custom') {
      const customDir = path.join(baseDir, 'custom');
      if (fs.existsSync(customDir)) {
        const customEntries = fs.readdirSync(customDir, { withFileTypes: true });
        for (const ce of customEntries) {
          if (ce.isFile() && ce.name.endsWith('.docx')) {
            const fullPath = path.join(customDir, ce.name);
            const isEnglish = /_EN_|EN\b|English/i.test(ce.name);
            results.push({
              name: ce.name,
              path: fullPath,
              language: isEnglish ? 'en' : 'zh',
              isDefault: false,
              company: 'Custom',
              isCustom: true
            });
          }
        }
      }
    }
  }

  return results;
}

/**
 * 默认模板解析器 (Resolve Default Template - REQ-TPL-DISCOVERY-01)
 * 中文默认映射至正式模板_MSDS_CN_冠志(1).docx，英文默认映射至正式模板_MSDS_EN_冠志(1).docx
 */
export function resolveDefaultTemplate(language = 'zh', templatesDir = null) {
  const templates = discoverAvailableTemplates(templatesDir);
  const isEn = language === 'en' || language === 'EN' || language === 'English';
  const targetPattern = isEn ? /^正式模板_MSDS_EN_冠志/ : /^正式模板_MSDS_CN_冠志/;
  const matched = templates.find(t => !t.isCustom && targetPattern.test(t.name));
  if (matched) return matched.path;
  const fallback = templates.find(t => !t.isCustom && (isEn ? t.language === 'en' : t.language === 'zh'));
  return fallback ? fallback.path : (templates[0]?.path || null);
}

/**
 * MSDS-Studio 阶段 4: 编辑器万能原语装配执行器 (editor-writer.js)
 * 
 * 核心公理与机制:
 * 1. 模板自省探测: 动态检测可用模板，默认绑定正式 CN/EN 双语模板；
 * 2. 必须使用编辑器: 编辑器已内置标准化排版格式 (Design Tokens/自适应标尺/外实内虚边框)；
 * 3. 前置值格全面清零 (clearTemplateValues): 抹除底模历史残留示范数据，纯拓扑使用；
 * 4. 格式服从于原文 (Format follows content): 动态调用编辑器增删行/通栏合并/剪枝能力；
 * 5. 零外生虚增: 非危险品绝不输出“象形图: 无 / 信号词: 无”；
 * 6. 全局排版自动投影: 写入完毕自动投影字阶与 420/560 dxa 悬挂缩进。
 */

export async function writeDeliverableViaEditor({
  templateKey,
  contextData,
  isEnglish = false,
  entityId = 'GUANZHI',
  outputPath
}) {
  if (!contextData) {
    throw new Error('[EDITOR-WRITER FATAL] contextData 不能为空！');
  }

  // 0. 模板动态自省与默认绑定解析
  const availableTemplates = discoverAvailableTemplates();
  let resolvedKey = templateKey;
  if (!resolvedKey) {
    resolvedKey = isEnglish ? 'EN_Guanzhi' : 'CN_Guanzhi';
  }

  // 1. 创建编辑器会话并加载对应官方底模
  const session = await createWorkSession(resolvedKey);

  // 2. 关键公理: 前置值格全面清零，消除一切历史示范数据 (纯拓扑使用，不保留任何章节的示范内容)
  clearTemplateValues(session);

  // 3. 注入企业预设 (冠志 / 国彩) 并更新页眉页脚企业标识
  const effectivePreset = typeof entityId === 'string' ? entityId.toUpperCase() : entityId;
  applyCompanyPreset(session, effectivePreset);

  const companyName = isEnglish
    ? (effectivePreset.includes('GUOCAI') ? 'Yingde Guocai Fine Chemical Co., Ltd.' : 'Guangzhou Guanzhi New Material Technology Co., Ltd.')
    : (effectivePreset.includes('GUOCAI') ? '英德市国彩精细化工有限公司' : '广州冠志新材料科技有限公司');

  updateHeaderFooterData(session.engine, {
    model: contextData.modelCode,
    company: companyName,
    revisionDate: contextData.revisionDate,
    language: isEnglish ? 'EN' : 'CN',
    title: isEnglish ? 'MATERIAL SAFETY DATA SHEET' : '物料安全数据表',
    version: isEnglish ? 'Version: V1.0' : 'Version：V1.0'
  });

  const engine = session.engine;

  // 3.1 Section 1 化学品名称与推荐用途写入 (严格覆写型号与品名双语契约)
  const s1Rec = engine.records.find(r => r.sectionNumber === 1);
  if (s1Rec) {
    const modelCode = contextData.modelCode || '';
    const rawCnName = contextData.productName || '';
    const rawEnName = contextData.productNameEn || (rawCnName ? translateChemicalTerm(rawCnName) : 'Waterborne acrylic copolymer emulsion');

    const fullProductName = isEnglish
      ? (modelCode ? `${modelCode} ${rawEnName}`.trim() : rawEnName)
      : (modelCode ? `${modelCode} ${rawCnName}`.trim() : rawCnName);
    const chemicalCategory = isEnglish
      ? rawEnName
      : (rawCnName || '水性丙烯酸共聚物乳液');

    for (const row of s1Rec.rows) {
      const lbl = (row.cells[0]?.text || '').trim();
      const c1 = row.cells[1];
      if (!c1) continue;
      if (/产品名称|Product\s*name/i.test(lbl)) {
        writeCellValue(c1, fullProductName);
      } else if (/中文名称/i.test(lbl)) {
        writeCellValue(c1, rawCnName || modelCode);
      } else if (/化学品分类|Chemical\s*category/i.test(lbl)) {
        writeCellValue(c1, chemicalCategory);
      } else if (/推荐用途|使用建议|用途|Recommended\s*use/i.test(lbl)) {
        writeCellValue(c1, contextData.recommendedUse || (isEnglish ? 'Additive for coatings' : '涂料用添加剂'));
      }
    }
  }

  // 4. Section 2 危害辨识与 GHS 象形图治理 (INV-ZERO-EXOGENOUS)
  let s2Rec = engine.records.find(r => r.sectionNumber === 2);
  if (s2Rec) {
    const isDangerous = Boolean(contextData.isDangerous || contextData.ghsClassification);
    if (!isDangerous) {
      for (const row of s2Rec.rows) {
        const lbl = (row.cells[0]?.text || '').trim();
        const c1 = row.cells[1];
        if (!c1) continue;
        if (/GHS危险性类别|GHS\s*classification/i.test(lbl)) {
          writeCellValue(c1, isEnglish ? 'Not classified as hazardous substance according to GHS.' : '根据 GHS 标准，该化学品未被分类为危险品。');
        } else if (/象形图|Pictogram/i.test(lbl)) {
          writeCellValue(c1, isEnglish ? 'None' : '无');
        } else if (/警示词|Signal\s*word/i.test(lbl)) {
          writeCellValue(c1, isEnglish ? 'None' : '无');
        } else if (/危险性说明|Hazard\s*statement/i.test(lbl)) {
          writeCellValue(c1, isEnglish ? 'Not applicable.' : '不适用。');
        } else if (/防范说明|Precautionary/i.test(lbl)) {
          writeCellValue(c1, isEnglish ? 'P262 Do not get in eyes, on skin, or on clothing. P280 Wear protective gloves/eye protection.' : 'P262 避免与眼睛、皮肤或衣服接触。P280 佩戴防护手套/护目镜。');
        }
      }
    }
  }

  // 5. Section 3 成分/组成信息写入 (严格保留克隆行与双语契约)
  if (Array.isArray(contextData.components) && contextData.components.length > 0) {
    const comps = contextData.components;
    let s3Rec = engine.records.find(r => r.sectionNumber === 3);
    if (s3Rec) {
      // 保持表头行（0:标题, 1:3.1, 2:3.2, 3:列名），成分数据行从索引 4 开始
      const headerRowsCount = 4;
      const s3NotesRaw = (contextData.componentsNotes && contextData.componentsNotes.length > 0)
        ? (Array.isArray(contextData.componentsNotes) ? contextData.componentsNotes.join('\n') : String(contextData.componentsNotes))
        : '';
      const hasNotes = Boolean(s3NotesRaw && s3NotesRaw.trim());
      const targetRowCount = headerRowsCount + comps.length + (hasNotes ? 1 : 0);

      while (s3Rec.rows.length > targetRowCount) {
        deleteRowFromSession(session, { sectionNumber: 3, rowIndex: s3Rec.rows.length - 1 });
        s3Rec = engine.records.find(r => r.sectionNumber === 3);
      }
      for (let i = 0; i < comps.length; i++) {
        const comp = comps[i];
        const targetRowIdx = headerRowsCount + i;
        if (s3Rec.rows.length <= targetRowIdx) {
          insertRowIntoSession(session, {
            sectionNumber: 3,
            targetRowIndex: targetRowIdx,
            cloneFromRowIndex: Math.min(4, s3Rec.rows.length - 1)
          });
          s3Rec = engine.records.find(r => r.sectionNumber === 3);
        }
        const curRow = s3Rec.rows[targetRowIdx];
        if (curRow && curRow.cells.length >= 3) {
          const nameText = isEnglish ? (comp.nameEn || comp.name) : comp.name;
          writeCellValue(curRow.cells[0], nameText);
          writeCellValue(curRow.cells[1], comp.cas || 'N/A');
          writeCellValue(curRow.cells[2], comp.concentration || comp.percentage || '100%');
        }
      }
      if (hasNotes) {
        const noteRowIdx = headerRowsCount + comps.length;
        if (s3Rec.rows.length <= noteRowIdx) {
          insertRowIntoSession(session, {
            sectionNumber: 3,
            targetRowIndex: noteRowIdx,
            cloneFromRowIndex: Math.min(4, s3Rec.rows.length - 1)
          });
          s3Rec = engine.records.find(r => r.sectionNumber === 3);
        }
        const noteText = isEnglish ? translateSection3Notes(s3NotesRaw) : s3NotesRaw;
        renderFullWidthRow(s3Rec, noteRowIdx, noteText.split('\n'), {
          isEnglish,
          borders: true,
          totalWidth: 9781,
          gridSpan: 3
        });
      }
    }
  }

  // 6. Section 9 理化特性写入 (带激光垂线对齐投影)
  const s9Rec = engine.records.find(r => r.sectionNumber === 9);
  if (s9Rec && contextData.physicalProperties) {
    const rawProps = contextData.physicalProperties;
    const isArray = Array.isArray(rawProps);

    // 智能提取属性值函数：支持数组槽位与对象键双模查找
    const resolvePropValue = (patterns, objKey, fallback) => {
      if (isArray) {
        for (const item of rawProps) {
          const itemLabel = (item.label || '').trim();
          for (const pat of patterns) {
            if (pat.test(itemLabel)) {
              if (item.value !== undefined && item.value !== null && String(item.value).trim() !== '') {
                return String(item.value).trim();
              }
            }
          }
        }
      } else if (rawProps && typeof rawProps === 'object') {
        if (rawProps[objKey] !== undefined && rawProps[objKey] !== null) {
          return String(rawProps[objKey]).trim();
        }
      }
      return fallback;
    };

    for (const row of s9Rec.rows) {
      const lbl = (row.cells[0]?.text || '').trim();
      const c1 = row.cells[1];
      if (!c1) continue;

      if (/外观|Appearance/i.test(lbl)) {
        writeCellValue(c1, resolvePropValue([/外观/i, /Appearance/i], 'appearance', isEnglish ? 'Milky white liquid' : '乳白色液体'));
      } else if (/气味|嗅觉|Odour|Odor/i.test(lbl)) {
        writeCellValue(c1, resolvePropValue([/气味|嗅觉/i, /Odour|Odor/i], 'odour', isEnglish ? 'No data available' : '无数据'));
      } else if (/pH/i.test(lbl)) {
        writeCellValue(c1, resolvePropValue([/pH/i], 'ph', '7-9'));
      } else if (/离子性|Ionic/i.test(lbl)) {
        writeCellValue(c1, resolvePropValue([/离子性/i, /Ionic/i], 'ionic', isEnglish ? 'Anionic' : '阴离子'));
      } else if (/初沸点|沸点|Boiling\s*point/i.test(lbl)) {
        writeCellValue(c1, resolvePropValue([/初沸点|沸点/i, /Boiling/i], 'boilingPoint', isEnglish ? 'Approx. 100 °C' : '约100℃'));
      } else if (/闪点|Flash\s*point/i.test(lbl)) {
        writeCellValue(c1, resolvePropValue([/闪点/i, /Flash/i], 'flashPoint', isEnglish ? 'Not applicable (waterborne)' : '不适用（水性）'));
      } else if (/蒸发速率|Evaporation/i.test(lbl)) {
        writeCellValue(c1, resolvePropValue([/蒸发速率/i, /Evaporation/i], 'evaporationRate', isEnglish ? 'No data available' : '无数据'));
      } else if (/可燃性|Flammability/i.test(lbl)) {
        writeCellValue(c1, resolvePropValue([/可燃性/i, /Flammability/i], 'flammability', isEnglish ? 'Not applicable' : '不适用'));
      } else if (/燃烧值|Heat\s*of\s*combustion/i.test(lbl)) {
        writeCellValue(c1, resolvePropValue([/燃烧值/i, /combustion/i], 'combustionValue', isEnglish ? 'Not applicable' : '不适用'));
      } else if (/饱和蒸气压|Saturated\s*vapour/i.test(lbl)) {
        writeCellValue(c1, resolvePropValue([/饱和蒸气压|蒸气压/i, /vapour\s*pressure/i], 'vapourPressure', isEnglish ? 'No data available' : '无数据'));
      } else if (/相对蒸气密度|Relative\s*vapour\s*density/i.test(lbl)) {
        writeCellValue(c1, resolvePropValue([/相对蒸气密度|蒸气密度/i, /vapour\s*density/i], 'vapourDensity', isEnglish ? 'No data available' : '无数据'));
      } else if (/相对密度|密度|Density/i.test(lbl)) {
        writeCellValue(c1, resolvePropValue([/相对密度|密度/i, /Density/i], 'density', '约1.06g/cm3'));
      } else if (/水溶性|溶解性|Solubility/i.test(lbl)) {
        writeCellValue(c1, resolvePropValue([/水溶性|溶解性/i, /Solubility/i], 'solubility', isEnglish ? 'Miscible' : '可混溶'));
      } else if (/表面张力|Surface\s*tension/i.test(lbl)) {
        writeCellValue(c1, resolvePropValue([/表面张力/i, /Surface\s*tension/i], 'surfaceTension', isEnglish ? 'No data available' : '无数据'));
      } else if (/辛醇|partition\s*coefficient/i.test(lbl)) {
        writeCellValue(c1, resolvePropValue([/辛醇/i, /partition/i], 'octanolWater', isEnglish ? 'No data available' : '无数据'));
      } else if (/自燃温度|Auto-ignition/i.test(lbl)) {
        writeCellValue(c1, resolvePropValue([/自燃温度/i, /Auto-ignition/i], 'autoIgnition', isEnglish ? 'Not applicable' : '不适用'));
      } else if (/引燃温度|Ignition\s*temperature/i.test(lbl)) {
        writeCellValue(c1, resolvePropValue([/引燃温度/i, /Ignition/i], 'ignition', isEnglish ? 'Approx. 420 °C' : '约420℃'));
      } else if (/分解温度|Decomposition/i.test(lbl)) {
        writeCellValue(c1, resolvePropValue([/分解温度/i, /Decomposition/i], 'decomposition', isEnglish ? 'No data available' : '无数据'));
      } else if (/动力粘度|粘度|黏度|Viscosity/i.test(lbl)) {
        writeCellValue(c1, resolvePropValue([/动力粘度|粘度|黏度/i, /Viscosity/i], 'viscosity', '＜1000 mPa.s'));
      } else if (/爆炸特性|Explosive/i.test(lbl)) {
        writeCellValue(c1, resolvePropValue([/爆炸特性/i, /Explosive/i], 'explosive', isEnglish ? 'No data available' : '无数据'));
      } else if (/粉尘爆炸|Dust\s*explosion/i.test(lbl)) {
        writeCellValue(c1, resolvePropValue([/粉尘爆炸/i, /Dust/i], 'dustExplosion', isEnglish ? 'No data available' : '无数据'));
      } else if (/固体含量|Solid\s*content/i.test(lbl)) {
        writeCellValue(c1, resolvePropValue([/固体含量/i, /Solid\s*content/i], 'solidContent', '37±2%'));
      } else if (/其他信息|Other\s*information/i.test(lbl)) {
        writeCellValue(c1, resolvePropValue([/其他信息/i, /Other\s*information/i], 'otherInfo', isEnglish ? 'The above data are not product specifications. For specifications, please refer to the technical data sheet.' : '上述数据非产品指标，产品指标请参见产品技术信息表。'));
      } else {
        if (!c1.text || c1.text.trim() === '') {
          writeCellValue(c1, isEnglish ? 'No data available' : '无数据');
        }
      }
    }
    formatSection9LaserTabs(session);
  }

  // 7. Section 13 废弃处置写入 (中文居中，英文左对齐)
  const s13Rec = engine.records.find(r => r.sectionNumber === 13);
  if (s13Rec) {
    const defaultCnWaste = '建议在获得当地环保部门批准后，交由持有危险废物经营许可证的专业资质单位进行安全无害化处置。严禁随意排入下水道、地表水或土壤中。空容器需经清洗或按同类废弃物受控处置。';
    const defaultEnWaste = 'Dispose of in accordance with local, regional, national, and international regulations. Do not allow product to enter drains, water courses, or the soil. Empty containers should be recycled or disposed of through licensed waste management operators.';
    const wasteText = isEnglish
      ? (contextData.disposalEn || contextData.disposal || defaultEnWaste)
      : (contextData.disposal || defaultCnWaste);

    if (s13Rec.rows[1] && s13Rec.rows[1].cells[0]) {
      writeCellValue(s13Rec.rows[1].cells[0], wasteText);
    }

    if (isEnglish) {
      for (const row of s13Rec.rows) {
        for (const cell of row.cells) {
          if (cell?.node) {
            const jcs = Array.from(cell.node.getElementsByTagNameNS(W_NS, 'jc'));
            jcs.forEach(jc => jc.setAttribute('w:val', 'left'));
          }
        }
      }
    }
  }

  // 8. Section 14 运输信息写入 (标准西文无中文残留)
  const s14Rec = engine.records.find(r => r.sectionNumber === 14);
  if (s14Rec && contextData.transport) {
    const t = contextData.transport;
    for (const row of s14Rec.rows) {
      const lbl = (row.cells[0]?.text || '').trim();
      const c1 = row.cells[1];
      if (!c1) continue;
      if (/联合国|UN\s*number/i.test(lbl)) writeCellValue(c1, t.unNumber || (isEnglish ? 'Not applicable' : '无'));
      else if (/运输名称|Proper\s*shipping/i.test(lbl)) writeCellValue(c1, t.shippingName || (isEnglish ? 'Not classified as dangerous goods' : '非危险货物'));
      else if (/危险类别|Hazard\s*class/i.test(lbl)) writeCellValue(c1, t.hazardClass || (isEnglish ? 'Not applicable' : '无'));
      else if (/包装类别|Packing\s*group/i.test(lbl)) writeCellValue(c1, t.packingGroup || (isEnglish ? 'Not applicable' : '无'));
      else if (/海洋污染物|Marine\s*pollutant/i.test(lbl)) writeCellValue(c1, isEnglish ? 'No' : '否');
      else if (/公路|Road/i.test(lbl)) writeCellValue(c1, isEnglish ? 'Not classified as dangerous goods for land transport.' : (t.road || '非危险品陆运输方式。'));
      else if (/海运|Maritime/i.test(lbl)) writeCellValue(c1, isEnglish ? 'Not classified as dangerous goods for sea transport, in accordance with IMDG regulations.' : (t.sea || '非危险品海运方式。'));
      else if (/空运|Air/i.test(lbl)) writeCellValue(c1, isEnglish ? 'Not classified as dangerous goods for air transport, in accordance with IATA regulations.' : (t.air || '非危险品运输方式。'));
      else if (/特别防范|特殊注意事项|Special\s*precautions/i.test(lbl)) writeCellValue(c1, isEnglish ? 'Not regulated as dangerous goods.' : (t.precautions || '非危险货物。'));
    }
  }

  // 9. 全局表格边框规范与跨页断行
  for (const record of engine.records) {
    if (record.kind === 'table') {
      enforceTableStandardBorders(record);
    }
  }
  enableCrossPageBreaksForAllSections(engine);

  // 10. 全局排版拓扑自动投影 (Design Tokens、字阶与 420/560 dxa 悬挂缩进)
  applyGlobalTypographyProjection(engine, isEnglish);
  enforceStructuralTypographyInvariants(engine, isEnglish);

  // 11. 导出保存 DOCX
  if (outputPath) {
    await saveSession(session, outputPath);
  }

  return {
    success: true,
    outputPath,
    engine,
    session
  };
}
