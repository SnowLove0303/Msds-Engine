import fs from 'fs';

let code = fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/universal-editor-primitives.js', 'utf8');

// 1. Parent label ind leftChars removal and 0
const oldPInd = `                ind.setAttribute('w:left', '420');
                ind.setAttribute('w:hanging', '420');
                ind.removeAttribute('w:firstLine');
                ind.removeAttribute('w:firstLineChars');`;

const newPInd = `                ind.setAttribute('w:left', '420');
                ind.setAttribute('w:hanging', '420');
                ind.removeAttribute('w:firstLine');
                ind.removeAttribute('w:firstLineChars');
                ind.removeAttribute('w:hangingChars');
                ind.removeAttribute('w:leftChars');
                ind.removeAttributeNS(W_NS, 'leftChars');
                ind.setAttributeNS(W_NS, 'w:leftChars', '0');`;

if (!code.includes(oldPInd)) {
  console.error('oldPInd not found in universal-editor-primitives.js');
  process.exit(1);
}
code = code.replace(oldPInd, newPInd);

// 2. Sub-label ind leftChars removal and 0
const oldSubInd = `                ind.setAttribute('w:left', '420');
                ind.removeAttribute('w:hanging');
                ind.removeAttribute('w:hangingChars');
                ind.removeAttribute('w:firstLine');
                ind.removeAttribute('w:firstLineChars');`;

const newSubInd = `                ind.setAttribute('w:left', '420');
                ind.removeAttribute('w:hanging');
                ind.removeAttribute('w:hangingChars');
                ind.removeAttribute('w:firstLine');
                ind.removeAttribute('w:firstLineChars');
                ind.removeAttribute('w:leftChars');
                ind.removeAttributeNS(W_NS, 'leftChars');
                ind.setAttributeNS(W_NS, 'w:leftChars', '0');`;

if (!code.includes(oldSubInd)) {
  console.error('oldSubInd not found in universal-editor-primitives.js');
  process.exit(1);
}
code = code.replace(oldSubInd, newSubInd);

// 3. Sub-val ind leftChars removal and 0
const oldSubValInd = `            ind.setAttribute('w:left', '240');
            ind.removeAttribute('w:hanging');
            ind.removeAttribute('w:firstLine');`;

const newSubValInd = `            ind.setAttribute('w:left', '240');
            ind.removeAttribute('w:hanging');
            ind.removeAttribute('w:firstLine');
            ind.removeAttribute('w:firstLineChars');
            ind.removeAttribute('w:leftChars');
            ind.removeAttributeNS(W_NS, 'leftChars');
            ind.setAttributeNS(W_NS, 'w:leftChars', '0');`;

if (!code.includes(oldSubValInd)) {
  console.error('oldSubValInd not found in universal-editor-primitives.js');
  process.exit(1);
}
code = code.replace(oldSubValInd, newSubValInd);

// 4. Adaptive sequence run sizes in rebuildUnifiedLabelRun
const oldSeqSz = `                  const seqSz = !isEnglish ? (seqStr.length >= 5 ? '20' : '21') : (seqStr.length >= 5 ? '18' : '19');`;
const newSeqSz = `                  const seqSz = !isEnglish ? (seqStr.length >= 5 ? '19' : '21') : (seqStr.length >= 5 ? '15' : '18');`;

if (!code.includes(oldSeqSz)) {
  console.error('oldSeqSz not found in universal-editor-primitives.js');
  process.exit(1);
}
code = code.replace(oldSeqSz, newSeqSz);

// 5. Adaptive sequence run sizes in runs loop
const oldRunSz = `                if (!isEnglish) {
                  runSz = (runText.length >= 5) ? '20' : '21';
                } else {
                  runSz = (runText.length >= 5) ? '18' : '19';
                }`;

const newRunSz = `                if (!isEnglish) {
                  runSz = (runText.length >= 5) ? '19' : '21';
                } else {
                  runSz = (runText.length >= 5) ? '15' : '18';
                }`;

if (!code.includes(oldRunSz)) {
  console.error('oldRunSz not found in universal-editor-primitives.js');
  process.exit(1);
}
code = code.replace(oldRunSz, newRunSz);

fs.writeFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/scripts/uep_proposed.js', code, 'utf8');
console.log('uep_proposed.js generated successfully!');
