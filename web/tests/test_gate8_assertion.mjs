import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';
import { DOMParser } from '@xmldom/xmldom';

const dir = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/PU-608';
const brokenBuf = fs.readFileSync(path.join(dir, 'PU-608 msds_CN 冠志.docx'));
const pristineBuf = fs.readFileSync(path.join(dir, 'PU-608 msds_CN 冠志_标准原始正品.docx'));

export function assertGate8ValuePurity(doc, docName = '') {
  const tables = Array.from(doc.getElementsByTagName('w:tbl'));
  const violations = [];
  
  for (let t = 0; t < tables.length; t++) {
    const tbl = tables[t];
    const rows = Array.from(tbl.getElementsByTagName('w:tr'));
    
    for (let r = 0; r < rows.length; r++) {
      const row = rows[r];
      const cells = Array.from(row.getElementsByTagName('w:tc'));
      if (cells.length < 2) continue; // single-column title/preamble
      
      for (let c = 1; c < cells.length; c++) {
        const cell = cells[c];
        const cellText = cell.textContent.trim();
        if (cellText === 'CAS编号' || cellText === '含量%（w/w）' || cellText === 'CAS NO.' || cellText === 'Concentration % (w/w)') continue;
        
        const runs = Array.from(cell.getElementsByTagName('w:r'));
        for (let ri = 0; ri < runs.length; ri++) {
          const run = runs[ri];
          const runText = run.textContent.trim();
          if (!runText) continue;
          
          // 1. Check bold
          const bEl = run.getElementsByTagName('w:b')[0];
          const isBold = bEl && bEl.getAttribute('w:val') !== '0';
          if (isBold) {
            const isSubLabel = /^(预防措施|事故响应|安全储存|废弃处置|经口|吸入|经皮|物种|分类|结果|Oral|Inhalation|Dermal|Species|Classification|Result)[：:]?$/i.test(runText);
            if (!isSubLabel) {
              violations.push(`【Gate 8 数值加粗违规】${docName} Table ${t + 1} Row ${r} Cell ${c} 包含非法加粗数值: "${runText}"`);
            }
          }
          
          // 2. Check font purity
          const rFonts = run.getElementsByTagName('w:rFonts')[0];
          if (rFonts) {
            const ascii = rFonts.getAttribute('w:ascii');
            const eastAsia = rFonts.getAttribute('w:eastAsia');
            if (ascii === 'Calibri' || eastAsia === 'Calibri') {
              violations.push(`【Gate 8 字体污染违规】${docName} Table ${t + 1} Row ${r} Cell ${c} 包含非法 Calibri 字体: "${runText}"`);
            }
          }
        }
      }
    }
  }
  return violations;
}

async function run() {
  const brokenDoc = new DOMParser().parseFromString(await (await JSZip.loadAsync(brokenBuf)).file('word/document.xml').async('text'), 'text/xml');
  const pristineDoc = new DOMParser().parseFromString(await (await JSZip.loadAsync(pristineBuf)).file('word/document.xml').async('text'), 'text/xml');

  const brokenViolations = assertGate8ValuePurity(brokenDoc, 'Damaged File');
  console.log(`Damaged File Gate 8 Violations: ${brokenViolations.length}`);
  brokenViolations.forEach(v => console.log('  ' + v));

  const pristineViolations = assertGate8ValuePurity(pristineDoc, 'Pristine File');
  console.log(`Pristine File Gate 8 Violations: ${pristineViolations.length}`);
  if (pristineViolations.length === 0) {
    console.log('  ✅ Pristine File 100% Passed Gate 8 (Zero Violations)!');
  } else {
    pristineViolations.forEach(v => console.log('  ' + v));
  }
}

run().catch(console.error);
