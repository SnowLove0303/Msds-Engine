import fs from 'fs';

const filePath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/pipeline-engine.js';
const orig = fs.readFileSync(filePath, 'utf8');

const t = `function formatRowAsSectionHeader(row, W_NS) {
  const ps = Array.from(row.getElementsByTagNameNS(W_NS, 'p'));
  for (const p of ps) {
    removeHangingIndentFromP(p, W_NS);
    let text = (p.textContent || '').trim();
    if (/^(?:1\\.?)*\\s*Identification$/i.test(text)) {
      text = '1. Identification';
    }
    rebuildRunsWithTypography(p, text, {
      font: 'Arial',
      sizeVal: '22', // 11pt
      bold: true
    }, W_NS);
  }
}`;

const r = `function formatRowAsSectionHeader(row, W_NS) {
  const ps = Array.from(row.getElementsByTagNameNS(W_NS, 'p'));
  for (const p of ps) {
    removeHangingIndentFromP(p, W_NS);
    const numPrs = Array.from(p.getElementsByTagNameNS(W_NS, 'numPr'));
    numPrs.forEach(n => n.parentNode?.removeChild(n));
    let text = (p.textContent || '').trim();
    if (/^(?:1\\.?)*\\s*Identification$/i.test(text)) {
      text = '1. Identification';
    }
    rebuildRunsWithTypography(p, text, {
      font: 'Arial',
      sizeVal: '22', // 11pt
      bold: true
    }, W_NS);
  }
}`;

if (!orig.includes(t)) {
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
