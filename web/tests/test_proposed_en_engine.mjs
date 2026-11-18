import { JSDOM } from 'jsdom';
const dom = new JSDOM('<!doctype html><html><body></body></html>');
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

import * as pe from '../src/proposed_pipeline_engine.js';
import { loadDocx } from '../src/docx-engine.js';
import fs from 'fs';

const modelCode = 'OS-9547 PGDA80';
const sourceDocxPath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料/6-2 水性封闭型异氰酸酯固化剂 BL/OS-9547PGDA80/OS-9547 PGDA80 msds_CN 冠志.docx';

const buf = fs.readFileSync(sourceDocxPath);
const baseCnEngine = await loadDocx(buf, 'cn.docx');

const facts = {
  modelCode,
  productNameEn: 'Water-dispersible isocyanate crosslinker OS-9547 PGDA80',
  chemicalCategoryEn: 'Hydrophilically modified polyisocyanate',
  recommendedUseEn: 'Crosslinker for waterborne 2K polyurethane systems',
  viscosityOverride: '300±100 mPa·s',
  section9Overrides: {
    '粘度|动力粘度': '300±100 mPa·s',
    '固体含量|固含': '80±2%',
    '密度': '约1.12 g/cm³',
    '外观': '无色至淡黄色透明粘稠液体'
  }
};

try {
  const enEngine = await pe.buildBaseEnglishEngine({
    modelCode,
    facts,
    baseCnEngine
  });
  console.log('✓ SUCCESS! English engine built with ZERO Chinese!');
} catch (e) {
  console.error('Failed:', e.message);
}
