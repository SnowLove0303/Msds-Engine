import { buildBaseChineseEngine, translateToxicologyValueToEnglish } from '../src/pipeline-engine.js';
import { JSDOM } from 'jsdom';
import fs from 'fs';

const dom = new JSDOM();
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

const buf = fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料/2-4 水溶性丙烯酸树脂 PA/PA-4840/PA-4840 msds_CN 冠志_源文件留存.docx');
const baseCn = await buildBaseChineseEngine({
  modelCode: 'PA-4840',
  cnGroundTruthBuffer: buf
});
const s11 = baseCn.records.find(r => r.sectionNumber === 11);

console.log('=== TESTING REAL PIPELINE-ENGINE TOXICOLOGY TRANSLATION ===');
let totalChineseChars = 0;
for (let ri = 3; ri < s11.rows.length; ri++) {
  const cnVal = s11.rows[ri].cells[s11.rows[ri].cells.length - 1].text;
  const enVal = translateToxicologyValueToEnglish(cnVal);
  const chMatches = enVal.match(/[\u4e00-\u9fa5]/g) || [];
  if (chMatches.length > 0) {
    console.log(`\nRow ${ri} [FAIL] (${chMatches.length} Chinese chars: ${chMatches.slice(0, 10).join('')}):`);
    console.log('CN:', cnVal);
    console.log('EN:', enVal);
    totalChineseChars += chMatches.length;
  } else {
    console.log(`Row ${ri} [PASS]`);
  }
}
console.log('\nTotal untranslated Chinese characters in S11:', totalChineseChars);
