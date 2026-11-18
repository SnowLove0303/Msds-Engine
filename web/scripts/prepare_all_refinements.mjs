import fs from 'fs';

// 1. pipeline-engine.js: update 手部防护 firstLine 482 -> left 420
let pCode = fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/pipeline-engine.js', 'utf8');

// replace lines 2438 and 2452
const oldHand1 = `          if (inds.length > 0) {
            inds.forEach(ind => {
              ind.setAttributeNS(W_NS, 'w:firstLine', '482');
              ind.setAttributeNS(W_NS, 'w:firstLineChars', '200');
              ind.removeAttributeNS(W_NS, 'w:left');
              ind.removeAttributeNS(W_NS, 'w:hanging');
              ind.removeAttributeNS(W_NS, 'w:leftChars');
              ind.removeAttributeNS(W_NS, 'w:hangingChars');
            });
          }
          const ps = Array.from(lblCell.node.getElementsByTagNameNS(W_NS, 'p'));
          if (ps.length > 0) {
            const firstP = ps[0];
            const pPr = firstP.getElementsByTagNameNS(W_NS, 'pPr')[0];
            if (pPr && pPr.getElementsByTagNameNS(W_NS, 'ind').length === 0) {
              const ind = firstP.ownerDocument.createElementNS(W_NS, 'w:ind');
              ind.setAttributeNS(W_NS, 'w:firstLine', '482');
              ind.setAttributeNS(W_NS, 'w:firstLineChars', '200');
              pPr.appendChild(ind);
            }`;

const newHand1 = `          if (inds.length > 0) {
            inds.forEach(ind => {
              ind.setAttributeNS(W_NS, 'w:left', '420');
              ind.removeAttributeNS(W_NS, 'w:firstLine');
              ind.removeAttributeNS(W_NS, 'w:firstLineChars');
              ind.removeAttributeNS(W_NS, 'w:hanging');
              ind.removeAttributeNS(W_NS, 'w:hangingChars');
            });
          }
          const ps = Array.from(lblCell.node.getElementsByTagNameNS(W_NS, 'p'));
          if (ps.length > 0) {
            const firstP = ps[0];
            const pPr = firstP.getElementsByTagNameNS(W_NS, 'pPr')[0];
            if (pPr && pPr.getElementsByTagNameNS(W_NS, 'ind').length === 0) {
              const ind = firstP.ownerDocument.createElementNS(W_NS, 'w:ind');
              ind.setAttributeNS(W_NS, 'w:left', '420');
              pPr.appendChild(ind);
            }`;

if (!pCode.includes(oldHand1)) {
  console.error('oldHand1 not found in pipeline-engine.js');
  process.exit(1);
}
pCode = pCode.replace(oldHand1, newHand1);

// replace line 3981
const oldHand2 = `      // 2. Section 8 中文手部防护缩进规范: 严禁异常悬挂缩进 (hanging=3373)，必须为标准首行缩进 482
      const handRowCn = s8Rec.rows.find(row => /手部防护/i.test(row.cells[0]?.text || ''));
      if (handRowCn && handRowCn.cells[0]?.node) {
        const c0 = handRowCn.cells[0].node;
        const inds = Array.from(c0.getElementsByTagNameNS(W_NS, 'ind'));
        inds.forEach(ind => {
          ind.setAttribute('w:firstLine', '482');
          ind.setAttribute('w:firstLineChars', '200');
          ind.removeAttribute('w:left');
          ind.removeAttribute('w:hanging');
          ind.removeAttribute('w:leftChars');
          ind.removeAttribute('w:hangingChars');
        });
      }`;

const newHand2 = `      // 2. Section 8 中文手部防护缩进规范: 统一采用 420 dxa 左缩进，与 8.1 暴字与 9.1 外观绝对铅垂对齐 (REQ-SUB-PARENT-ALIGN)
      const handRowCn = s8Rec.rows.find(row => /手部防护/i.test(row.cells[0]?.text || ''));
      if (handRowCn && handRowCn.cells[0]?.node) {
        const c0 = handRowCn.cells[0].node;
        const inds = Array.from(c0.getElementsByTagNameNS(W_NS, 'ind'));
        inds.forEach(ind => {
          ind.setAttribute('w:left', '420');
          ind.removeAttribute('w:firstLine');
          ind.removeAttribute('w:firstLineChars');
          ind.removeAttribute('w:hanging');
          ind.removeAttribute('w:hangingChars');
        });
      }`;

if (!pCode.includes(oldHand2)) {
  console.error('oldHand2 not found in pipeline-engine.js');
  process.exit(1);
}
pCode = pCode.replace(oldHand2, newHand2);

fs.writeFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/scripts/pipeline_engine_proposed3.js', pCode, 'utf8');
console.log('pipeline_engine_proposed3.js prepared successfully!');

// 2. universal-editor-primitives.js: update isSeqRun adaptive size
let uCode = fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/universal-editor-primitives.js', 'utf8');

const oldRunSz = `              const isSeqRun = isS9Chinese && /^(\\d+\\.\\d+)\\s*$/.test(runText);
              const runSz = isSeqRun ? '21' : targetLblSz;`;

const newRunSz = `              const isSeqRun = /^(\\d+\\.\\d+(?:\\.\\d+)?)\\s*$/.test(runText);
              let runSz = targetLblSz;
              if (isSeqRun) {
                if (!isEnglish) {
                  runSz = (runText.length >= 5) ? '20' : '21';
                } else {
                  runSz = (runText.length >= 5) ? '18' : '19';
                }
              }`;

if (!uCode.includes(oldRunSz)) {
  console.error('oldRunSz not found in universal-editor-primitives.js');
  process.exit(1);
}
uCode = uCode.replace(oldRunSz, newRunSz);

fs.writeFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/scripts/universal_primitives_proposed3.js', uCode, 'utf8');
console.log('universal_primitives_proposed3.js prepared successfully!');
