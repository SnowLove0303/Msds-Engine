import fs from 'fs';

const pePath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/pipeline-engine.js';
let pe = fs.readFileSync(pePath, 'utf8');

const oldFormatValueCell = `      applyRunStyle(r, {
        font: 'Arial',
        sizeVal: '19', // 9.5pt
        bold: false
      }, W_NS);`;

const newFormatValueCell = `      const bEl = r.getElementsByTagNameNS(W_NS, 'b')[0];
      const isAlreadyBold = bEl && bEl.getAttributeNS(W_NS, 'val') !== '0';
      const isSubLabel = /^(?:Species|Classification|Result|Repeated dose toxicity|Pathological changes|Oral|Inhalation|Dermal|Prevention|Response|Storage|Disposal):?$/i.test(runTxt);
      applyRunStyle(r, {
        font: 'Arial',
        sizeVal: '19', // 9.5pt
        bold: Boolean(isAlreadyBold || isSubLabel)
      }, W_NS);`;

// 注意在循环里取 runTxt
const oldRunsLoop = `    for (let rIdx = 0; rIdx < runs.length; rIdx++) {
      const r = runs[rIdx];
      const t = r.getElementsByTagNameNS(W_NS, 't')[0];
      if (t && t.textContent) {
        let text = t.textContent.replace(/：/g, ': ');
        text = text.replace(/[ \\t]{2,}/g, ' '); // 压缩多余连续空格，避免视觉大间距
        if (rIdx === 0) {
          text = text.replace(/^\\s+/, ''); // 清除行首前导空格
        }
        t.textContent = text;
      }
      applyRunStyle(r, {
        font: 'Arial',
        sizeVal: '19', // 9.5pt
        bold: false
      }, W_NS);
    }`;

const newRunsLoop = `    for (let rIdx = 0; rIdx < runs.length; rIdx++) {
      const r = runs[rIdx];
      const t = r.getElementsByTagNameNS(W_NS, 't')[0];
      const runTxt = (t && t.textContent) ? t.textContent.trim() : '';
      if (t && t.textContent) {
        let text = t.textContent.replace(/：/g, ': ');
        text = text.replace(/[ \\t]{2,}/g, ' '); // 压缩多余连续空格，避免视觉大间距
        if (rIdx === 0) {
          text = text.replace(/^\\s+/, ''); // 清除行首前导空格
        }
        t.textContent = text;
      }
      const bEl = r.getElementsByTagNameNS(W_NS, 'b')[0];
      const isAlreadyBold = bEl && bEl.getAttributeNS(W_NS, 'val') !== '0';
      const isSubLabel = /^(?:Species|Classification|Result|Repeated dose toxicity|Pathological changes|Oral|Inhalation|Dermal|Prevention|Response|Storage|Disposal):?$/i.test(runTxt);
      applyRunStyle(r, {
        font: 'Arial',
        sizeVal: '19', // 9.5pt
        bold: Boolean(isAlreadyBold || isSubLabel)
      }, W_NS);
    }`;

pe = pe.replace(oldRunsLoop, newRunsLoop);

fs.writeFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/scripts/proposed_format_value_fix.js', pe, 'utf8');
console.log('proposed_format_value_fix.js generated');
