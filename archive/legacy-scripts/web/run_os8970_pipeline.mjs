import { JSDOM } from 'jsdom';
const dom = new JSDOM();
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

import fs from 'node:fs/promises';
import path from 'node:path';
import { executeEightDeliverablesPipeline } from './src/pipeline-engine.js';

async function run() {
  const modelCode = 'OS-8970';
  const srcPath = 'E:/冠志/TDS MSDS (2)/TDS MSDS/产品 TDS MSDS -- WORD版本/水性噁唑啉交联剂/OS-8970 msds_CN 冠志.docx';
  const targetDirE = 'E:/冠志/TDS MSDS (2)/TDS MSDS/产品 TDS MSDS -- WORD版本/水性噁唑啉交联剂';
  const targetDirEngine = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/OS-8970';

  const os8970Facts = {
    viscosity: '＜1000 mPa·s',
    viscosityOverride: '＜1000 mPa·s',
    solids: '约25%',
    isNonHazardous: true,
    components: [
      { name: 'Oxazoline-modified acrylic polymer', cas: 'Trade secret', conc: '20-30' },
      { name: 'Water', cas: '7732-18-5', conc: '70-80' }
    ],
    overrides: {
      'sec1.product_name': 'Waterborne oxazoline crosslinker OS-8970',
      'sec1.chemical_category': 'Oxazoline-modified acrylic polymer',
      'sec1.recommended_use': 'Additive for coatings, inks, and adhesives',
      'sec2.ghs_classification': 'Classification of the substance or mixture:\nNot classified as a hazardous chemical according to GHS.',
      'sec2.ghs_label_elements': 'GHS label elements:\nNot classified as a hazardous chemical according to GHS.',
      'sec2.precautionary_statements': 'Precautionary statements:\nNot applicable.',
      'sec2.other_hazards': 'Other hazards:\nNo applicable information.',
      'sec3.product_type': 'Mixture',
      'sec3.comp1_name': 'Oxazoline-modified acrylic polymer',
      'sec3.comp1_cas': 'Trade secret',
      'sec3.comp1_conc': '20-30',
      'sec3.comp2_name': 'Water',
      'sec3.comp2_cas': '7732-18-5',
      'sec3.comp2_conc': '70-80',
      'sec9.appearance': 'Light yellow to yellow transparent liquid',
      'sec9.ph': '6.5-8.5',
      'sec9.flash_point': 'No flash point below initial boiling point',
      'sec9.solubility': 'Miscible',
      'sec9.viscosity': '＜1000 mPa·s',
      'sec9.solids': 'Approx. 25%',
      'sec9.other_info': 'The above data are not product specifications. Please refer to the Technical Data Sheet for specifications.'
    }
  };

  console.log('--- Executing pipeline for E: destination ---');
  const resE = await executeEightDeliverablesPipeline({
    modelCode,
    cnGroundTruthPath: srcPath,
    targetDir: targetDirE,
    facts: os8970Facts
  });
  console.log(`Delivered to E: in ${resE.durationMs}ms`);
  resE.deliverables.forEach(d => console.log(`  [${d.format.toUpperCase()}] ${d.name} (${d.size} bytes)`));

  console.log('\n--- Executing pipeline for Engine material destination ---');
  const resEngine = await executeEightDeliverablesPipeline({
    modelCode,
    cnGroundTruthPath: srcPath,
    targetDir: targetDirEngine,
    facts: os8970Facts
  });
  console.log(`Delivered to Engine in ${resEngine.durationMs}ms`);
}

run().catch(err => {
  console.error('Pipeline failed:', err);
  process.exit(1);
});
