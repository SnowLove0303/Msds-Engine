import fs from 'fs';

const filePath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/pipeline-engine.js';
const orig = fs.readFileSync(filePath, 'utf8');

const t = `  // 10.5 规范化 Section 15：源文件仅 4 部法规时，剔除底模外生强塞的 GB 15258`;

const r = `  // 10.4 规范化 Section 3：第 3 行 3.2成分 通栏三列合并 (gridSpan=3, w=9781 dxa)
  const s3Rec = engine.records.find(r => r.sectionNumber === 3);
  if (s3Rec && s3Rec.rows.length >= 3) {
    const r2 = s3Rec.rows[2];
    if (r2 && r2.cells.length === 3) {
      const txt0 = (r2.cells[0]?.text || '').trim();
      if (/^(?:3\\.2\\s*)?(?:成分|Ingredients)/i.test(txt0)) {
        try {
          const W_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
          const rNode = r2.node;
          const cNodes = Array.from(rNode.getElementsByTagNameNS(W_NS, 'tc'));
          if (cNodes.length >= 3) {
            rNode.removeChild(cNodes[1]);
            rNode.removeChild(cNodes[2]);
            let tcPr = cNodes[0].getElementsByTagNameNS(W_NS, 'tcPr')[0];
            if (!tcPr) {
              tcPr = cNodes[0].ownerDocument.createElementNS(W_NS, 'w:tcPr');
              cNodes[0].insertBefore(tcPr, cNodes[0].firstChild);
            }
            let span = tcPr.getElementsByTagNameNS(W_NS, 'gridSpan')[0];
            if (!span) {
              span = cNodes[0].ownerDocument.createElementNS(W_NS, 'w:gridSpan');
              tcPr.appendChild(span);
            }
            span.setAttributeNS(W_NS, 'w:val', '3');
            let tcW = tcPr.getElementsByTagNameNS(W_NS, 'tcW')[0];
            if (!tcW) {
              tcW = cNodes[0].ownerDocument.createElementNS(W_NS, 'w:tcW');
              tcPr.appendChild(tcW);
            }
            tcW.setAttributeNS(W_NS, 'w:w', '9781');
            tcW.setAttributeNS(W_NS, 'w:type', 'dxa');
            r2.cells = [r2.cells[0]];
          }
        } catch (e) {}
      }
    }
  }

  // 10.5 规范化 Section 15：源文件仅 4 部法规时，剔除底模外生强塞的 GB 15258`;

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
