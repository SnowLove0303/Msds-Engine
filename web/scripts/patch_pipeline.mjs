import fs from 'fs';

const filePath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/pipeline-engine.js';
let content = fs.readFileSync(filePath, 'utf8');

const s2CnTarget = `      const cnSignal = (parsed.signalWord && parsed.signalWord !== '无') ? parsed.signalWord : '无';
      paragraphs.push(\`信号词：\${cnSignal}\`);`;

const s2CnReplacement = `      // 仅当源文件明确载明信号词时输出，严禁外生兜底虚增“信号词：无” (INV-ZERO-EXOGENOUS)
      if (parsed.signalWord) {
        paragraphs.push(\`信号词：\${parsed.signalWord}\`);
      }`;

const s2EnTarget = `      const enSignal = parsed.signalWord === '危险' ? 'Danger' : (parsed.signalWord === '警告' ? 'Warning' : 'None');
      paragraphs.push(\`Signal word: \${enSignal}\`);`;

const s2EnReplacement = `      // 仅当源文件明确载明信号词时输出英译，严禁捏造“Signal word: None” (INV-ZERO-EXOGENOUS)
      if (parsed.signalWord) {
        const enSignal = parsed.signalWord === '危险' ? 'Danger' : (parsed.signalWord === '警告' ? 'Warning' : parsed.signalWord);
        paragraphs.push(\`Signal word: \${enSignal}\`);
      }`;

const s8Target = `      // 清理手套参数末尾多余西文句点
      if (row.cells.length > 1 && row.cells[1]?.node) {
        const W_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
        const p = row.cells[1].node.getElementsByTagNameNS(W_NS, 'p')[0];
        if (p) {
          const tNode = p.getElementsByTagNameNS(W_NS, 't')[0];
          if (tNode && /(?:厚度|穿透时间|≧|mm|min)\\.$/.test(tNode.textContent.trim())) {
            tNode.textContent = tNode.textContent.trim().replace(/\\.$/, '');
          }
        }
      }`;

const s8Replacement = `      // 统一手套材料与参数值文本排版格式与 XML Run 纯净化 (INV-TYPOGRAPHY-S8)
      if (row.cells.length > 1 && row.cells[1]?.node && /(?:氟化橡胶|丁基橡胶|丁腈橡胶|合适材料|手套)/i.test(lbl)) {
        const W_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
        const p = row.cells[1].node.getElementsByTagNameNS(W_NS, 'p')[0];
        if (p) {
          // 清理末尾无文本内容的空 <w:r> 节点，消除结构冗余
          const runs = Array.from(p.getElementsByTagNameNS(W_NS, 'r'));
          for (let rIdx = 1; rIdx < runs.length; rIdx++) {
            const tNodes = Array.from(runs[rIdx].getElementsByTagNameNS(W_NS, 't'));
            const textContent = tNodes.map(t => t.textContent).join('').trim();
            if (!textContent) {
              p.removeChild(runs[rIdx]);
            }
          }
          // 对首个文本 Run 执行值文本排版规范化：
          // 1. 全角≧/≦统一转换为标准西文≥/≤
          // 2. 数值与计量单位之间必须插入标准西文半角空格（0.4 mm、480 min）
          // 3. 规整分号与清除末尾孤立句点
          const firstR = p.getElementsByTagNameNS(W_NS, 'r')[0];
          if (firstR) {
            const tNodes = Array.from(firstR.getElementsByTagNameNS(W_NS, 't'));
            let fullVal = tNodes.map(t => t.textContent).join('');
            if (fullVal) {
              fullVal = fullVal
                .replace(/≧/g, '≥')
                .replace(/≦/g, '≤')
                .replace(/(\\d+(?:\\.\\d+)?)\\s*(mm|min|mPa\\.s|kPa|°C|%)\\b/gi, '$1 $2')
                .replace(/；\\s*/g, '；')
                .replace(/[\\.．]+$/, '')
                .trim();
              if (tNodes.length > 0) {
                tNodes[0].textContent = fullVal;
                for (let i = 1; i < tNodes.length; i++) {
                  firstR.removeChild(tNodes[i]);
                }
              }
            }
            // 字体属性强化：西文 Times New Roman，中文宋体
            let rPr = firstR.getElementsByTagNameNS(W_NS, 'rPr')[0];
            if (!rPr) {
              rPr = firstR.ownerDocument.createElementNS(W_NS, 'w:rPr');
              firstR.insertBefore(rPr, firstR.firstChild);
            }
            let rFonts = rPr.getElementsByTagNameNS(W_NS, 'rFonts')[0];
            if (!rFonts) {
              rFonts = firstR.ownerDocument.createElementNS(W_NS, 'w:rFonts');
              rPr.appendChild(rFonts);
            }
            rFonts.setAttributeNS(W_NS, 'w:ascii', 'Times New Roman');
            rFonts.setAttributeNS(W_NS, 'w:hAnsi', 'Times New Roman');
            rFonts.setAttributeNS(W_NS, 'w:eastAsia', '宋体');
            rFonts.setAttributeNS(W_NS, 'w:cs', 'Arial');
          }
        }
      }`;

const isCRLF = content.includes('\r\n');
const norm = s => isCRLF ? s.replace(/\r?\n/g, '\r\n') : s.replace(/\r\n/g, '\n');

console.log('s2Cn match:', content.includes(norm(s2CnTarget)));
console.log('s2En match:', content.includes(norm(s2EnTarget)));
console.log('s8 match:', content.includes(norm(s8Target)));

if (content.includes(norm(s2CnTarget)) && content.includes(norm(s2EnTarget)) && content.includes(norm(s8Target))) {
  let newContent = content
    .replace(norm(s2CnTarget), norm(s2CnReplacement))
    .replace(norm(s2EnTarget), norm(s2EnReplacement))
    .replace(norm(s8Target), norm(s8Replacement));
  fs.writeFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/scripts/proposed_pipeline_engine.js', newContent, 'utf8');
  console.log('Proposed file written successfully!');
} else {
  console.error('Target strings not found!');
}
