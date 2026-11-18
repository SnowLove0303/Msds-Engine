import { JSDOM } from 'jsdom';
const dom = new JSDOM('<!doctype html><html><body></body></html>');
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

import { buildBaseChineseEngine, buildBaseEnglishEngine } from '../src/proposed_pipeline_engine.js';

const sourceDocxPath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料/6-2 水性封闭型异氰酸酯固化剂 BL/OS-9547PGDA80/OS-9547 PGDA80 msds_CN 冠志.docx';

const facts = {
  modelCode: 'OS-9547 PGDA80',
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

const baseCnEngine = await buildBaseChineseEngine({
  modelCode: 'OS-9547 PGDA80',
  cnGroundTruthPath: sourceDocxPath,
  facts
});

const baseEnEngine = await buildBaseEnglishEngine({
  modelCode: 'OS-9547 PGDA80',
  baseCnEngine,
  facts
});

const s9Cn = baseCnEngine.records.find(r => r.sectionNumber === 9);
const s9En = baseEnEngine.records.find(r => r.sectionNumber === 9);

console.log('CN S9 rows count:', s9Cn?.rows?.length);
s9Cn?.rows?.forEach((r, idx) => console.log(`  CN [${idx}]:`, r.cells.map(c => c.text || '').join(' | ')));

console.log('\nEN S9 rows count:', s9En?.rows?.length);
s9En?.rows?.forEach((r, idx) => console.log(`  EN [${idx}]:`, r.cells.map(c => c.text || '').join(' | ')));
