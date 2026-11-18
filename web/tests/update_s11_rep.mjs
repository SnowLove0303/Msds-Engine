import fs from 'fs';

const filePath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/pipeline-engine.js';
let content = fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n');

// 1. In buildBaseEnglishEngine: write 'No data available.' to Reproductive toxicity when repRowInCn is true
const targetRep = `else if (/Reproductive toxicity/i.test(rText) && repCn) safeWrite(lastCell, translateToxicologyValueToEnglish(repCn));`;
const replRep = `else if (/Reproductive toxicity/i.test(rText)) {
          const repRowInCn = cnS11?.rows?.some(r => /生殖毒性/i.test(r.cells[0]?.text || ''));
          if (repRowInCn) {
            safeWrite(lastCell, repCn ? translateToxicologyValueToEnglish(repCn) : 'No data available.');
          }
        }`;

content = content.replace(targetRep, replRep);

// 2. In buildBaseChineseEngine: ensure empty Section 11 cells have '无数据资料。'
const targetCnS11 = `  // 11. 规范化 Section 11：单组分插槽表格高精排版 (严格源事实驱动，通用排版，绝无针对型号硬编码假数据)
  let s11 = engine.records.find(r => r.sectionNumber === 11);`;

const replCnS11 = `  // 11. 规范化 Section 11：单组分插槽表格高精排版 (严格源事实驱动，通用排版，绝无针对型号硬编码假数据)
  let s11 = engine.records.find(r => r.sectionNumber === 11);
  if (s11) {
    for (let i = 2; i < s11.rows.length; i++) {
      const c = s11.rows[i].cells[s11.rows[i].cells.length - 1];
      if (c && !(c.text || '').trim()) {
        safeWriteCellValue(c, '无数据资料。');
      }
    }
  }`;

content = content.replace(targetCnS11, replCnS11);

fs.writeFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/proposed_pipeline_engine.js', content, 'utf8');
console.log('Successfully written proposed_pipeline_engine.js');
