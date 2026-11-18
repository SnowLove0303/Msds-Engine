import { JSDOM } from 'jsdom';
if (!globalThis.DOMParser || !globalThis.XMLSerializer) {
  const dom = new JSDOM('<!doctype html><html><body></body></html>');
  globalThis.DOMParser = dom.window.DOMParser;
  globalThis.XMLSerializer = dom.window.XMLSerializer;
}

import path from 'path';
import fs from 'node:fs/promises';
import {
  buildBaseChineseEngine,
  buildBaseEnglishEngine,
  derivePresetEngines
} from '../src/pipeline-engine.js';
import { enforceTableStandardBorders, renumberRecord } from '../src/docx-engine.js';

const modelCode = 'OS-9547 PGDA80';
const sourceDocxPath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料/6-2 水性封闭型异氰酸酯固化剂 BL/OS-9547PGDA80/OS-9547 PGDA80 msds_CN 冠志.docx';
const targetDir = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/06-1 水分散型异氰酸酯固化剂 OS/OS-9547 PGDA80';

const facts = {
  modelCode,
  productNameEn: 'Water-dispersible isocyanate crosslinker OS-9547 PGDA80',
  chemicalCategoryEn: 'Hydrophilically modified polyisocyanate',
  recommendedUseEn: 'Crosslinker for waterborne 2K polyurethane systems',
  viscosityOverride: '300±100 mPa·s',
  appearanceOverride: '无色至淡黄色透明粘稠液体',
  solidsOverride: '80±2%',
  densityOverride: '约 1.12 g/cm³',
  ncoOverride: '17.8±0.5%',
  section9Overrides: {
    '外观': '无色至淡黄色透明粘稠液体',
    '粘度|动力粘度': '300±100 mPa·s',
    '固体含量|固含': '80±2%',
    '密度': '约 1.12 g/cm³',
    'NCO': '17.8±0.5%'
  }
};

async function run() {
  console.log('1. Loading CN Guanzhi baseline...');
  const baseCnEngine = await buildBaseChineseEngine({
    modelCode,
    cnGroundTruthPath: sourceDocxPath,
    viscosityOverride: facts.viscosityOverride || facts.viscosity,
    facts
  });

  const todayDateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '/');
  const isOutdated = !baseCnEngine._adaptiveRevisionDate || baseCnEngine._adaptiveRevisionDate.startsWith('2023') || baseCnEngine._adaptiveRevisionDate.startsWith('2024') || baseCnEngine._adaptiveRevisionDate.startsWith('2025');
  const effectiveDate = !isOutdated ? baseCnEngine._adaptiveRevisionDate : todayDateStr;

  console.log('2. Building Base EN Guanzhi engine...');
  const baseEnEngine = await buildBaseEnglishEngine({
    modelCode,
    baseCnEngine,
    facts,
    revisionDate: effectiveDate
  });

  console.log('3. Deriving Guocai entity variants...');
  const { cnPresetEngine, enPresetEngine } = await derivePresetEngines({
    modelCode,
    baseCnEngine,
    baseEnEngine,
    entityId: 'GUOCAI',
    revisionDate: effectiveDate
  });

  for (const eng of [baseCnEngine, baseEnEngine, cnPresetEngine, enPresetEngine]) {
    for (const record of eng.records) {
      if (record.kind === 'table') {
        enforceTableStandardBorders(record);
      }
    }
    const s9 = eng.records.find(r => r.sectionNumber === 9);
    if (s9) renumberRecord(s9);
  }

  console.log('4. Exporting 4 DOCX deliverables...');
  const cnGuanzhiBuf = await baseCnEngine.exportArrayBuffer();
  const cnGuocaiBuf = await cnPresetEngine.exportArrayBuffer();
  const enGuanzhiBuf = await baseEnEngine.exportArrayBuffer();
  const enGuocaiBuf = await enPresetEngine.exportArrayBuffer();

  await fs.writeFile(path.join(targetDir, `${modelCode} msds_CN 冠志.docx`), Buffer.from(cnGuanzhiBuf));
  await fs.writeFile(path.join(targetDir, `${modelCode} msds_CN 国彩.docx`), Buffer.from(cnGuocaiBuf));
  await fs.writeFile(path.join(targetDir, `${modelCode} msds_EN Guanzhi.docx`), Buffer.from(enGuanzhiBuf));
  await fs.writeFile(path.join(targetDir, `${modelCode} msds_EN Guocai.docx`), Buffer.from(enGuocaiBuf));

  console.log('Successfully written all 4 DOCX deliverables to disk!');
}

run().catch(console.error);
