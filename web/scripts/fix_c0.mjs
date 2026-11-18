import fs from 'fs';

const filePath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/pipeline-engine.js';
const orig = fs.readFileSync(filePath, 'utf8');

const t = `      else if (/Firefighting precautions/i.test(lbl)) {
        writeCellLabel(c0, '5.4\\tFirefighting precautions and protective equipment:', true);
        safeWrite(c1, enValues['sec5.protective_equipment']);
      }`;

const r = `      else if (/Firefighting precautions/i.test(lbl)) {
        writeCellLabel(row.cells[0], '5.4\\tFirefighting precautions and protective equipment:', true);
        safeWrite(c1, enValues['sec5.protective_equipment']);
      }`;

if (!orig.includes(t)) {
  // Check CRLF
  const tCrlf = t.replace(/\n/g, '\r\n');
  const rCrlf = r.replace(/\n/g, '\r\n');
  if (!orig.includes(tCrlf)) {
    throw new Error('Target not found!');
  }
  const updated = orig.replace(tCrlf, rCrlf);
  fs.writeFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/scripts/pipeline_engine_proposed.js', updated, 'utf8');
} else {
  const updated = orig.replace(t, r);
  fs.writeFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/scripts/pipeline_engine_proposed.js', updated, 'utf8');
}

console.log('pipeline_engine_proposed.js created.');
