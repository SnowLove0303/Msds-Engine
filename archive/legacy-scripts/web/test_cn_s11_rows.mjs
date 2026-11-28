import { JSDOM } from 'jsdom';
if (!globalThis.DOMParser || !globalThis.XMLSerializer) {
  const dom = new JSDOM('<!doctype html><html><body></body></html>');
  globalThis.DOMParser = dom.window.DOMParser;
  globalThis.XMLSerializer = dom.window.XMLSerializer;
}

import { buildBaseChineseEngine } from './src/pipeline-engine.js';

const sourceDocxPath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料/6-2 水性封闭型异氰酸酯固化剂 BL/OS-9547PGDA80/OS-9547 PGDA80 msds_CN 冠志.docx';

const facts = {
  modelCode: 'OS-9547 PGDA80',
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

async function main() {
  const engine = await buildBaseChineseEngine({
    modelCode: 'OS-9547 PGDA80',
    cnGroundTruthPath: sourceDocxPath,
    facts
  });

  const s11 = engine.records.find(r => r.sectionNumber === 11);
  console.log(`Base CN S11 has ${s11.rows.length} rows:`);
  s11.rows.forEach((r, i) => {
    console.log(`Row ${i}:`, r.cells.map(c => c.text).join(' | '));
  });
}
main().catch(console.error);
