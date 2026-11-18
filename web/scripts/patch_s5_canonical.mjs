import fs from 'fs';

const filePath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/pipeline-engine.js';
const orig = fs.readFileSync(filePath, 'utf8');

const t1 = `      else if (/Firefighting precautions/i.test(lbl)) {
        writeCellLabel(row.cells[0], '5.4\\tFirefighting precautions and protective equipment:', true);
        safeWrite(c1, enValues['sec5.protective_equipment']);
      }`;
const r1 = `      else if (/Firefighting precautions/i.test(lbl)) safeWrite(c1, enValues['sec5.protective_equipment']);`;

const t2 = `  } else if (/Saturated vapour/i.test(cleanLabel)) {
    cleanLabel = 'Saturated vapour pressure:';`;
const r2 = `  } else if (/Saturated vapour/i.test(cleanLabel)) {
    cleanLabel = 'Saturated vapour pressure:';
  } else if (/Firefighting precautions/i.test(cleanLabel)) {
    cleanLabel = 'Firefighting precautions and protective equipment:';`;

let updated = orig;
if (orig.includes(t1)) {
  updated = updated.replace(t1, r1);
} else {
  const t1Crlf = t1.replace(/\n/g, '\r\n');
  const r1Crlf = r1.replace(/\n/g, '\r\n');
  if (!orig.includes(t1Crlf)) throw new Error('Target 1 not found!');
  updated = updated.replace(t1Crlf, r1Crlf);
}

if (updated.includes(t2)) {
  updated = updated.replace(t2, r2);
} else {
  const t2Crlf = t2.replace(/\n/g, '\r\n');
  const r2Crlf = r2.replace(/\n/g, '\r\n');
  if (!updated.includes(t2Crlf)) throw new Error('Target 2 not found!');
  updated = updated.replace(t2Crlf, r2Crlf);
}

fs.writeFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/scripts/pipeline_engine_proposed.js', updated, 'utf8');
console.log('pipeline_engine_proposed.js created.');
