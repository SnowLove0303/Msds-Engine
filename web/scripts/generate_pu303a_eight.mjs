import fs from 'node:fs/promises';
import path from 'node:path';
import { JSDOM } from 'jsdom';
import { loadDocx, updateHeaderFooterData, applyPresetPriorityOverlay, SYSTEM_DEFAULT_PRESETS, writeCellValue } from '../src/docx-engine.js';
import { runSmartMatching, applyMatchResultToEditor } from '../src/smart-matching.js';
import { convertBatchDocxToPdf, isPdfConverterAvailable } from '../src/pdf-converter.js';

const dom = new JSDOM('<!doctype html><html><body></body></html>');
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

const targetDir = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/PU-303A';
const sourceFile = path.join(targetDir, 'PU-303A msds_CN 冠志.docx');
const sourcePreservedFile = path.join(targetDir, 'PU-303A msds_CN 冠志（源文件）.docx');

const cnTplPath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/public/templates/正式模板_MSDS_CN_冠志(1).docx';
const enTplPath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/public/templates/正式模板_MSDS_EN_冠志(1).docx';

console.log('=== 开始执行 PU-303A 八格式两阶段并发构建流水线 ===\n');
const pipelineStart = Date.now();

// 1. 保留源文件
const srcBuf = await fs.readFile(sourceFile);
await fs.writeFile(sourcePreservedFile, srcBuf);
console.log('✅ 源文件已安全备份保留至：PU-303A msds_CN 冠志（源文件）.docx');

// 2. 并行载入模板
const [cnTplBuf, enTplBuf] = await Promise.all([
  fs.readFile(cnTplPath),
  fs.readFile(enTplPath),
]);

// 3. 解析源文件并执行智能匹配
const srcDoc = await loadDocx(srcBuf, 'PU-303A_src.docx');
const matchRes = runSmartMatching(srcDoc.records);
console.log(`✅ 智能匹配完成：共匹配 16 个章节，${matchRes.summary?.matchedFields} 处要素\n`);

// 提取象形图绘图节点
const sec2Matched = matchRes.matchedSections.find((s) => s.sectionNumber === 2);
const picItem = sec2Matched?.matchedRows?.find((r) => r.key === 'pictogram');
const drawNodes = picItem?.drawingNodes || (picItem?.drawingNode ? [picItem.drawingNode] : null);

// =========================================================================
// 阶段一：Word 4 格式先同步并发产出 (CN/EN × 冠志/国彩)
// =========================================================================
console.log('⚡ [阶段一] 开始并发生成 4 份 DOCX 标准交付物...');
const stage1Start = Date.now();

// 任务 1: 冠志中文版
async function buildCnGuanzhi() {
  const doc = await loadDocx(cnTplBuf, 'PU-303A msds_CN 冠志.docx');
  applyMatchResultToEditor(matchRes, doc);
  updateHeaderFooterData(doc, {
    company: '广州冠志新材料科技有限公司',
    title: '物料安全数据表',
    version: 'V1.0',
    model: 'PU-303A',
    docCode: 'PU-303A-MSDS',
    revisionDate: '2023/9/27',
    language: 'CN',
    entity: '冠志',
  });
  const buf = Buffer.from(await doc.exportArrayBuffer());
  const filePath = path.join(targetDir, 'PU-303A msds_CN 冠志.docx');
  await fs.writeFile(filePath, buf);
  console.log(`  ✅ [Word 1/4] 冠志中文版已生成 (${Math.round(buf.length / 1024)} KB)`);
  return { name: 'PU-303A msds_CN 冠志.docx', buffer: buf, doc };
}

// 任务 2: 国彩中文版
async function buildCnGuocai(baseDoc) {
  const doc = await loadDocx(cnTplBuf, 'PU-303A msds_CN 国彩.docx');
  const presetGuocaiCn = SYSTEM_DEFAULT_PRESETS.find((p) => p.id === 'preset_guocai_cn');
  applyPresetPriorityOverlay(baseDoc, presetGuocaiCn, doc);

  const gcCnS1 = doc.records.find((r) => r.sectionNumber === 1 && r.kind === 'table');
  if (gcCnS1) {
    if (gcCnS1.rows[6]?.cells[1]?.editable) writeCellValue(gcCnS1.rows[6].cells[1], '英德市国彩精细化工有限公司');
    if (gcCnS1.rows[7]?.cells[1]?.editable) writeCellValue(gcCnS1.rows[7].cells[1], '广东省英德市白沙镇太平村更古坑凯迪工业园区');
    if (gcCnS1.rows[8]?.cells[1]?.editable) writeCellValue(gcCnS1.rows[8].cells[1], '86-763-2811205');
    if (gcCnS1.rows[9]?.cells[1]?.editable) writeCellValue(gcCnS1.rows[9].cells[1], '86-763-2811024');
  }

  const gcSec2 = doc.records.find((r) => r.sectionNumber === 2 && r.kind === 'table');
  const gcPicCell = gcSec2?.rows?.find((r) => /象形图/i.test(r.cells[0]?.text || ''))?.cells?.[1];
  if (drawNodes && gcPicCell) {
    const { transferDrawingToCell } = await import('../src/docx-engine.js');
    transferDrawingToCell(srcDoc, doc, drawNodes, gcPicCell);
  }

  const buf = Buffer.from(await doc.exportArrayBuffer());
  const filePath = path.join(targetDir, 'PU-303A msds_CN 国彩.docx');
  await fs.writeFile(filePath, buf);
  console.log(`  ✅ [Word 2/4] 国彩中文版已生成 (${Math.round(buf.length / 1024)} KB)`);
  return { name: 'PU-303A msds_CN 国彩.docx', buffer: buf };
}

// 任务 3: 冠志英文版
async function buildEnGuanzhi() {
  const doc = await loadDocx(enTplBuf, 'PU-303A msds_EN 冠志.docx');
  applyMatchResultToEditor(matchRes, doc);
  updateHeaderFooterData(doc, {
    company: 'Guangzhou Guanzhi New Materials Technology Co., Ltd.',
    title: 'MATERIAL SAFETY DATA SHEET',
    version: 'V1.0',
    model: 'PU-303A',
    docCode: 'PU-303A-MSDS',
    revisionDate: '2023/9/27',
    language: 'EN',
    entity: 'Guanzhi',
  });

  // Section 1
  const enS1 = doc.records.find((r) => r.sectionNumber === 1 && r.kind === 'table');
  if (enS1) {
    if (enS1.rows[1]?.cells[1]?.editable) writeCellValue(enS1.rows[1].cells[1], 'Waterborne polyurethane dispersion PU-303A');
    if (enS1.rows[2]?.cells[1]?.editable) writeCellValue(enS1.rows[2].cells[1], 'Polyurethane dispersion');
    if (enS1.rows[3]?.cells[1]?.editable) writeCellValue(enS1.rows[3].cells[1], 'Used in clothing leather, denim paste, vamp leather, luggage leather, polishing paste, textile coating and other soft substrate finishing industries.');
    if (enS1.rows[5]?.cells[1]?.editable) writeCellValue(enS1.rows[5].cells[1], 'Guangzhou Guanzhi New Materials Technology Co., Ltd.');
    if (enS1.rows[6]?.cells[1]?.editable) writeCellValue(enS1.rows[6].cells[1], 'Room 1106, Area A, Guangzhou International Enterprise Incubator, No. 3 Juquan Road, Science City, Guangzhou');
    if (enS1.rows[7]?.cells[1]?.editable) writeCellValue(enS1.rows[7].cells[1], '86-20-82567990');
    if (enS1.rows[8]?.cells[1]?.editable) writeCellValue(enS1.rows[8].cells[1], '86-20-32214789');
  }

  // Section 2
  const enS2 = doc.records.find((r) => r.sectionNumber === 2 && r.kind === 'table');
  if (enS2) {
    const ghsRow = enS2.rows.find((r) => /2\.1|Classification/i.test(r.cells[0]?.text || ''));
    if (ghsRow) {
      const targetCell = ghsRow.cells[ghsRow.cells.length - 1];
      if (targetCell?.editable) {
        writeCellValue(targetCell, 
`Acute toxicity (Inhalation), Category 4 (H332)
Skin corrosion/irritation, Category 3 (H316)
Serious eye damage/eye irritation, Category 2B (H320)
Reproductive toxicity, Category 1B (H360)
Specific target organ toxicity - single exposure, Category 1 (H370)
Specific target organ toxicity - repeated exposure, Category 2 (H373)`);
      }
    }
    const sigRow = enS2.rows.find((r) => /Signal Word|信号词/i.test(r.cells[0]?.text || ''));
    if (sigRow && sigRow.cells[sigRow.cells.length - 1]?.editable) writeCellValue(sigRow.cells[sigRow.cells.length - 1], 'Danger');

    const hRow = enS2.rows.find((r) => /Hazard Statements|危险性说明/i.test(r.cells[0]?.text || ''));
    if (hRow && hRow.cells[hRow.cells.length - 1]?.editable) {
      writeCellValue(hRow.cells[hRow.cells.length - 1],
`H316 Causes mild skin irritation.
H320 Causes eye irritation.
H332 Harmful if inhaled.
H360 May damage fertility or the unborn child.
H370 Causes damage to organs.
H373 May cause damage to organs through prolonged or repeated exposure (Liver).`);
    }

    const pRow = enS2.rows.find((r) => /Precautionary Statements|防范说明/i.test(r.cells[0]?.text || ''));
    if (pRow && pRow.cells[pRow.cells.length - 1]?.editable) {
      writeCellValue(pRow.cells[pRow.cells.length - 1],
`Prevention:
P201 Obtain special instructions before use.
P202 Do not handle until all safety precautions have been read and understood.
P260 Do not breathe dust/fume/gas/mist/vapours/spray.
P264 Wash hands thoroughly after handling.
P270 Do not eat, drink or smoke when using this product.
P271 Use only outdoors or in a well-ventilated area.
P280 Wear protective gloves/protective clothing/eye protection/face protection.
Response:
P304+P340 IF INHALED: Remove person to fresh air and keep comfortable for breathing.
P305+P351+P338 IF IN EYES: Rinse cautiously with water for several minutes. Remove contact lenses, if present and easy to do. Continue rinsing.
P308+P311 IF exposed or concerned: Call a POISON CENTER/doctor.
P314 Get medical advice/attention if you feel unwell.
P332+P313 If skin irritation occurs: Get medical advice/attention.
P337+P313 If eye irritation persists: Get medical advice/attention.
Storage:
P405 Store locked up.
Disposal:
P501 Dispose of contents/container in accordance with local regulations.`);
    }

    const othRow = enS2.rows.find((r) => /Other Hazards|其他危害/i.test(r.cells[0]?.text || ''));
    if (othRow && othRow.cells[othRow.cells.length - 1]?.editable) writeCellValue(othRow.cells[othRow.cells.length - 1], 'No applicable information.');

    const enPicCell = enS2.rows.find((r) => /Pictogram|象形图/i.test(r.cells[0]?.text || ''))?.cells?.[1];
    if (drawNodes && enPicCell) {
      const { transferDrawingToCell } = await import('../src/docx-engine.js');
      transferDrawingToCell(srcDoc, doc, drawNodes, enPicCell);
    }
  }

  // Section 3
  const enS3 = doc.records.find((r) => r.sectionNumber === 3 && r.kind === 'table');
  if (enS3) {
    if (enS3.rows[1]?.cells[1]?.editable) writeCellValue(enS3.rows[1].cells[1], 'Mixture');
    if (enS3.rows[4]?.cells[0]?.editable) {
      writeCellValue(enS3.rows[4].cells[0], 'Polyurethane dispersion');
      writeCellValue(enS3.rows[4].cells[1], '9009-54-5');
      writeCellValue(enS3.rows[4].cells[2], '28.0~31.0');
    }
    if (enS3.rows[5]?.cells[0]?.editable) {
      writeCellValue(enS3.rows[5].cells[0], 'Deionized water');
      writeCellValue(enS3.rows[5].cells[1], '7732-18-5');
      writeCellValue(enS3.rows[5].cells[2], '57.0~61.0');
    }
    if (enS3.rows[6]?.cells[0]?.editable) {
      writeCellValue(enS3.rows[6].cells[0], 'N,N-Dimethylacetamide (DMAC)');
      writeCellValue(enS3.rows[6].cells[1], '127-19-5');
      writeCellValue(enS3.rows[6].cells[2], '11.0~12.0');
    }
  }

  // Section 4
  const enS4 = doc.records.find((r) => r.sectionNumber === 4 && r.kind === 'table');
  if (enS4) {
    if (enS4.rows[1]?.cells[1]?.editable) writeCellValue(enS4.rows[1].cells[1], 'Remove soiled or soaked clothing immediately.');
    if (enS4.rows[2]?.cells[1]?.editable) writeCellValue(enS4.rows[2].cells[1], 'Wash off with soap and plenty of water.');
    if (enS4.rows[3]?.cells[1]?.editable) writeCellValue(enS4.rows[3].cells[1], 'Hold eyelids open and rinse thoroughly with plenty of water for at least 15 minutes. Seek medical advice.');
    if (enS4.rows[4]?.cells[1]?.editable) writeCellValue(enS4.rows[4].cells[1], 'Do not induce vomiting without medical advice. Seek medical advice immediately.');
    if (enS4.rows[5]?.cells[1]?.editable) writeCellValue(enS4.rows[5].cells[1], 'Move to fresh air. If discomfort persists, seek medical advice.');
  }

  // Section 5
  const enS5 = doc.records.find((r) => r.sectionNumber === 5 && r.kind === 'table');
  if (enS5) {
    if (enS5.rows[1]?.cells[1]?.editable) writeCellValue(enS5.rows[1].cells[1], 'Carbon dioxide (CO2), alcohol-resistant foam, dry chemical powder. Use water spray for large fires.');
    if (enS5.rows[2]?.cells[1]?.editable) writeCellValue(enS5.rows[2].cells[1], 'High volume water jet.');
    if (enS5.rows[3]?.cells[1]?.editable) writeCellValue(enS5.rows[3].cells[1], 'Carbon monoxide, carbon dioxide, nitrogen oxides may be released during combustion. Do not breathe fumes in case of fire or explosion.');
    if (enS5.rows[4]?.cells[1]?.editable) writeCellValue(enS5.rows[4].cells[1], 'Firefighters must wear self-contained breathing apparatus. Do not allow contaminated fire water to enter soil, groundwater or surface water.');
  }

  // Section 6
  const enS6 = doc.records.find((r) => r.sectionNumber === 6 && r.kind === 'table');
  if (enS6) {
    if (enS6.rows[1]?.cells[1]?.editable) writeCellValue(enS6.rows[1].cells[1], 'Wear protective equipment. Ensure adequate ventilation. Keep unauthorized personnel away.');
    if (enS6.rows[2]?.cells[1]?.editable) writeCellValue(enS6.rows[2].cells[1], 'Do not flush into sewer, surface water or soil.');
    if (enS6.rows[3]?.cells[1]?.editable) writeCellValue(enS6.rows[3].cells[1], 'Absorb with chemical absorbent material or dry sand if necessary, collect and store in tightly closed containers.');
  }

  // Section 7
  const enS7 = doc.records.find((r) => r.sectionNumber === 7 && r.kind === 'table');
  if (enS7) {
    if (enS7.rows[1]?.cells[1]?.editable) writeCellValue(enS7.rows[1].cells[1], 'Use only in areas with appropriate exhaust ventilation. Avoid contact with skin and eyes. Do not breathe vapours or spray. Keep away from food, drink and tobacco. Wash hands before breaks and immediately after handling. Change contaminated clothing.');
    if (enS7.rows[2]?.cells[1]?.editable) writeCellValue(enS7.rows[2].cells[1], 'Keep container tightly closed in a cool, well-ventilated place. To maintain product quality, strictly observe storage conditions specified in technical information.');
  }

  // Section 8
  const enS8 = doc.records.find((r) => r.sectionNumber === 8 && r.kind === 'table');
  if (enS8) {
    for (const row of enS8.rows) {
      const lbl = row.cells[0]?.text?.trim() || '';
      const valCell = row.cells[row.cells.length - 1];
      if (!valCell || !valCell.editable) continue;
      if (/Respiratory/i.test(lbl)) writeCellValue(valCell, 'Respiratory protection required during spraying.');
      else if (/Hand/i.test(lbl)) writeCellValue(valCell, 'Protective gloves recommended.');
      else if (/Suitable material/i.test(lbl)) writeCellValue(valCell, 'EN 374-3');
      else if (/Fluoro/i.test(lbl)) writeCellValue(valCell, 'Thickness >= 0.4mm; Breakthrough time >= 480min.');
      else if (/Butyl/i.test(lbl)) writeCellValue(valCell, 'Thickness >= 0.5mm; Breakthrough time >= 480min.');
      else if (/Nitrile/i.test(lbl)) writeCellValue(valCell, 'Thickness >= 0.35mm; Breakthrough time >= 480min.');
      else if (/Recommendation/i.test(lbl)) writeCellValue(valCell, 'Contaminated gloves should be discarded.');
      else if (/Eye/i.test(lbl)) writeCellValue(valCell, 'Wear safety goggles/face shield.');
      else if (/Body/i.test(lbl)) writeCellValue(valCell, 'Wear suitable protective clothing.');
    }
  }

  // Section 9
  const enS9 = doc.records.find((r) => r.sectionNumber === 9 && r.kind === 'table');
  if (enS9) {
    const propVals = [
      'Bluish translucent emulsion', 'No data available.', '7-9', 'Anionic',
      'Approx. 100°C', 'Not applicable.', 'No data available.', 'Not applicable.',
      'Not applicable.', 'Approx. 130 hPa at 50°C', 'No data available.', '1.0-1.1 g/cm3',
      'Completely miscible', 'No data available.', 'No data available.', 'Not applicable.',
      'No data available.', 'No data available.', '< 250 mPa.s', 'No data available.',
      'Not applicable.', '30±2% (150°C, 30min)', 'The above data are not product specifications; refer to product technical data sheet.'
    ];
    for (let i = 1; i <= propVals.length && i < enS9.rows.length; i++) {
      const cell = enS9.rows[i].cells[enS9.rows[i].cells.length - 1];
      if (cell && cell.editable) writeCellValue(cell, propVals[i - 1]);
    }
  }

  // Section 10
  const enS10 = doc.records.find((r) => r.sectionNumber === 10 && r.kind === 'table');
  if (enS10) {
    if (enS10.rows[1]?.cells[1]?.editable) writeCellValue(enS10.rows[1].cells[1], 'No decomposition if used according to specifications.');
    if (enS10.rows[2]?.cells[1]?.editable) writeCellValue(enS10.rows[2].cells[1], 'Neutralizing agents are released during drying/curing.');
    if (enS10.rows[3]?.cells[1]?.editable) writeCellValue(enS10.rows[3].cells[1], 'No hazardous reactions when stored and handled properly.');
  }

  // Section 11
  const enS11 = doc.records.find((r) => r.sectionNumber === 11 && r.kind === 'table');
  if (enS11) {
    if (enS11.rows[1]?.cells[0]?.editable) writeCellValue(enS11.rows[1].cells[0], 'No toxicological studies are available on the product itself.');
    if (enS11.rows[2]?.cells[0]?.editable) writeCellValue(enS11.rows[2].cells[0], 'The following are toxicological data for N,N-Dimethylacetamide (CAS: 127-19-5):');
    if (enS11.rows[3]?.cells?.[2]?.editable) writeCellValue(enS11.rows[3].cells[2], 'Oral: LD50 / Rat: 3,000 - 6,000 mg/kg');
    if (enS11.rows[4]?.cells?.[1]?.editable) writeCellValue(enS11.rows[4].cells[1], 'Inhalation: LC50 / 1h / Rat (Female): 8.81 mg/l (Only applicable if inhalable particles are formed.)\nLC50 / 4h / Rat (Female): 2.2 mg/l');
    if (enS11.rows[5]?.cells?.[1]?.editable) writeCellValue(enS11.rows[5].cells[1], 'Dermal: LD50 / Guinea pig: < 940 mg/kg');
    if (enS11.rows[6]?.cells?.[0]?.editable) writeCellValue(enS11.rows[6].cells[0], 'According to available data, N,N-Dimethylacetamide is harmful if inhaled and causes mild skin irritation.');
    if (enS11.rows[7]?.cells?.[1]?.editable) writeCellValue(enS11.rows[7].cells[1], 'Species: Rabbit\nClassification: Irritating to skin\nResult: Mild skin irritation');
    if (enS11.rows[8]?.cells?.[1]?.editable) writeCellValue(enS11.rows[8].cells[1], 'Species: Rabbit\nClassification: Irritating to eyes\nResult: Mild eye irritation');
    if (enS11.rows[9]?.cells?.[1]?.editable) writeCellValue(enS11.rows[9].cells[1], 'Species: Guinea pig\nClassification: Not a skin sensitizer\nResult: Did not cause sensitization in laboratory animals\n\nSpecies: Human\nClassification: Not a skin sensitizer\nResult: Skin contact test on human volunteers showed no sensitizing properties');
    if (enS11.rows[10]?.cells?.[1]?.editable) writeCellValue(enS11.rows[10].cells[1], 'No evidence of mutagenic effects in bacterial or mammalian cell culture assays. No evidence of gene damage in animal studies.');
    if (enS11.rows[11]?.cells?.[1]?.editable) writeCellValue(enS11.rows[11].cells[1], 'No carcinogenic effects observed in animal tests.');
    if (enS11.rows[12]?.cells?.[2]?.editable) writeCellValue(enS11.rows[12].cells[2], 'Animal experiments show no reproductive toxicity.');
    if (enS11.rows[13]?.cells?.[1]?.editable) writeCellValue(enS11.rows[13].cells[1], 'Embryotoxic effects were observed in animal experiments at doses below those causing maternal toxicity. Reduced embryo/fetal viability, retarded fetal development (variants), and malformations.');
    if (enS11.rows[14]?.cells?.[1]?.editable) writeCellValue(enS11.rows[14].cells[1], 'No data available.');
    if (enS11.rows[15]?.cells?.[1]?.editable) writeCellValue(enS11.rows[15].cells[1], 'Repeat dose toxicity: Oral\nPathological changes: stomach, testes, liver, kidney, abnormal decrease in red blood cells.\n\nRepeat dose toxicity: Inhalation\nPathological changes: kidney and liver effects, retinal damage.');
    if (enS11.rows[16]?.cells?.[1]?.editable) writeCellValue(enS11.rows[16].cells[1], 'No data available.');
    if (enS11.rows[17]?.cells?.[1]?.editable) writeCellValue(enS11.rows[17].cells[1], 'Consumption of alcoholic beverages may enhance toxic effects.');
  }

  // Section 12-16
  const enS12 = doc.records.find((r) => r.sectionNumber === 12 && r.kind === 'table');
  if (enS12) {
    if (enS12.rows[1]?.cells[0]?.editable) writeCellValue(enS12.rows[1].cells[0], 'No ecotoxicological studies are available on the product itself.');
    if (enS12.rows[2]?.cells[0]?.editable) writeCellValue(enS12.rows[2].cells[0], 'The following are ecotoxicological data for N,N-Dimethylacetamide (CAS: 127-19-5):');
    if (enS12.rows[3]?.cells[1]?.editable) writeCellValue(enS12.rows[3].cells[1], 'Toxicity to fish:\nLC50 / 96h / Pimephales promelas (Fathead minnow): 1,500 mg/l\nOther:\nEC50 / 72h / Algae: > 500 mg/l\nEC50 / 48h / Daphnia magna: > 500 mg/l');
    if (enS12.rows[4]?.cells[1]?.editable) writeCellValue(enS12.rows[4].cells[1], 'No data available.');
    if (enS12.rows[5]?.cells[1]?.editable) writeCellValue(enS12.rows[5].cells[1], 'No data available.');
  }

  const enS13 = doc.records.find((r) => r.sectionNumber === 13 && r.kind === 'table');
  if (enS13) {
    if (enS13.rows[1]?.cells[0]?.editable) writeCellValue(enS13.rows[1].cells[0], 'Must be disposed of in accordance with applicable national, state or local regulations.\nDisposal within the EU should be in accordance with the appropriate regulations of the European Waste Catalogue (EWC).');
    if (enS13.rows[2]?.cells[1]?.editable) writeCellValue(enS13.rows[2].cells[1], 'Empty containers as thoroughly as possible (e.g. by pouring, scraping or draining until "drip dry"). Send to suitable collection points according to existing recycling schemes of the chemical industry. Containers must be recycled in accordance with national laws and environmental regulations. Do not discharge waste into sewers.');
  }

  const enS14 = doc.records.find((r) => r.sectionNumber === 14 && r.kind === 'table');
  if (enS14) {
    if (enS14.rows[1]?.cells[1]?.editable) writeCellValue(enS14.rows[1].cells[1], 'Non-hazardous for land transport.');
    if (enS14.rows[2]?.cells[1]?.editable) writeCellValue(enS14.rows[2].cells[1], 'Non-hazardous for sea transport.');
    if (enS14.rows[3]?.cells[1]?.editable) writeCellValue(enS14.rows[3].cells[1], 'Non-hazardous for air transport.');
    if (enS14.rows[4]?.cells[1]?.editable) writeCellValue(enS14.rows[4].cells[1], 'Non-hazardous goods.\nAvoid temperatures above +35°C, do not store below +5°C.\nKeep away from food, acids and bases.');
  }

  const enS15 = doc.records.find((r) => r.sectionNumber === 15 && r.kind === 'table');
  if (enS15) {
    if (enS15.rows[1]?.cells[0]?.editable) writeCellValue(enS15.rows[1].cells[0], 'Safety, health and environmental regulations/legislation specific for the substance or mixture');
    if (enS15.rows[4]?.cells[0]?.editable) writeCellValue(enS15.rows[4].cells[0], 'Regulations on the Safety Administration of Hazardous Chemicals (State Council Decree No. 591)');
    if (enS15.rows[5]?.cells[0]?.editable) writeCellValue(enS15.rows[5].cells[0], 'GB/T 16483 Safety data sheet for chemical products - Content and order of sections');
    if (enS15.rows[6]?.cells[0]?.editable) writeCellValue(enS15.rows[6].cells[0], 'GB 13690 General rule for classification and hazard communication of chemicals');
    if (enS15.rows[7]?.cells[0]?.editable) writeCellValue(enS15.rows[7].cells[0], 'GB 30000.2-29 Specification for classification and labelling of chemicals');
    if (enS15.rows[8]?.cells[0]?.editable) writeCellValue(enS15.rows[8].cells[0], 'GB 15258 General rules for preparation of precautionary label for chemicals');
  }

  const enS16 = doc.records.find((r) => r.sectionNumber === 16 && r.kind === 'table');
  if (enS16) {
    if (enS16.rows[1]?.cells[0]?.editable) writeCellValue(enS16.rows[1].cells[0], 'To the best of our knowledge, the information provided in this Safety Data Sheet is correct at the date of its publication. The information given is designed only as a guidance for safe handling, use, processing, storage, transportation, disposal and release and is not to be considered a warranty or quality specification. The information relates only to the specific material designated and may not be valid for such material used in combination with any other materials or in any process, unless specified in the text.');
  }

  const buf = Buffer.from(await doc.exportArrayBuffer());
  const filePath = path.join(targetDir, 'PU-303A msds_EN 冠志.docx');
  await fs.writeFile(filePath, buf);
  console.log(`  ✅ [Word 3/4] 冠志英文版已生成 (${Math.round(buf.length / 1024)} KB)`);
  return { name: 'PU-303A msds_EN 冠志.docx', buffer: buf };
}

// 任务 4: 国彩英文版
async function buildEnGuocai(enGzBuf) {
  const doc = await loadDocx(enGzBuf, 'PU-303A msds_EN 国彩.docx');
  updateHeaderFooterData(doc, {
    company: 'Yingde Guocai New Material Co., Ltd.',
    title: 'MATERIAL SAFETY DATA SHEET',
    version: 'V1.0',
    model: 'PU-303A',
    docCode: 'PU-303A-MSDS',
    revisionDate: '2023/9/27',
    language: 'EN',
    entity: 'Guocai',
  });
  const gcEnS1 = doc.records.find((r) => r.sectionNumber === 1 && r.kind === 'table');
  if (gcEnS1) {
    if (gcEnS1.rows[5]?.cells[1]?.editable) writeCellValue(gcEnS1.rows[5].cells[1], 'Yingde Guocai Fine Chemical Co., Ltd.');
    if (gcEnS1.rows[6]?.cells[1]?.editable) writeCellValue(gcEnS1.rows[6].cells[1], 'Kaidi Industrial Park, Genggukeng, Taiping Village, Baisha Town, Yingde, Guangdong, China');
    if (gcEnS1.rows[7]?.cells[1]?.editable) writeCellValue(gcEnS1.rows[7].cells[1], '86-763-2811205');
    if (gcEnS1.rows[8]?.cells[1]?.editable) writeCellValue(gcEnS1.rows[8].cells[1], '86-763-2811024');
  }
  const buf = Buffer.from(await doc.exportArrayBuffer());
  const filePath = path.join(targetDir, 'PU-303A msds_EN 国彩.docx');
  await fs.writeFile(filePath, buf);
  console.log(`  ✅ [Word 4/4] 国彩英文版已生成 (${Math.round(buf.length / 1024)} KB)`);
  return { name: 'PU-303A msds_EN 国彩.docx', buffer: buf };
}

// 并发启动任务群
const cnGzTask = buildCnGuanzhi();
const enGzTask = buildEnGuanzhi();

const [cnGzRes, enGzRes] = await Promise.all([cnGzTask, enGzTask]);
const [cnGcRes, enGcRes] = await Promise.all([
  buildCnGuocai(cnGzRes.doc),
  buildEnGuocai(enGzRes.buffer),
]);

const docxList = [cnGzRes, cnGcRes, enGzRes, enGcRes];
console.log(`⚡ [阶段一完成] 4 份 Word 全部并发产出完毕，耗时：${Date.now() - stage1Start}ms\n`);

// =========================================================================
// 阶段二：4 份高保真 PDF 批量极速并发转译 (单次拉起批处理管道)
// =========================================================================
console.log('⚡ [阶段二] 开始批量并发转译 4 份高保真 PDF...');
const stage2Start = Date.now();

if (isPdfConverterAvailable()) {
  const pdfTargets = docxList.map((item) => ({
    docxBuffer: item.buffer,
    fileName: item.name,
    outPdfName: item.name.replace(/\.docx$/, '.pdf'),
  }));

  const pdfResults = await convertBatchDocxToPdf(pdfTargets);

  await Promise.all(
    pdfResults.map(async (res, idx) => {
      const outPath = path.join(targetDir, pdfTargets[idx].outPdfName);
      await fs.writeFile(outPath, res.pdfBuffer);
      console.log(`  ✅ [PDF ${idx + 1}/4] ${pdfTargets[idx].outPdfName} (${Math.round(res.pdfBuffer.length / 1024)} KB)`);
    })
  );

  console.log(`⚡ [阶段二完成] 4 份 PDF 批量极速并发转换完毕，耗时：${Date.now() - stage2Start}ms\n`);
} else {
  console.error('❌ PDF 转换引擎不可用！');
}

console.log(`🎉 全量八格式交付流水线执行完毕！总耗时：${Date.now() - pipelineStart}ms\n`);
