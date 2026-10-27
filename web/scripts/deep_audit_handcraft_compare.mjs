import fs from 'node:fs';
import JSZip from 'jszip';
import { DOMParser } from '@xmldom/xmldom';

const goldPath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/PA-3223/PA-3223 msds_CN 冠志 手做改版材料.docx';
const genPath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/PA-3223/PA-3223 msds_CN 冠志.docx';

async function main() {
  const goldZip = await JSZip.loadAsync(fs.readFileSync(goldPath));
  const genZip = await JSZip.loadAsync(fs.readFileSync(genPath));

  const goldDoc = new DOMParser().parseFromString(await goldZip.file('word/document.xml').async('text'), 'text/xml');
  const genDoc = new DOMParser().parseFromString(await genZip.file('word/document.xml').async('text'), 'text/xml');

  const goldTables = goldDoc.getElementsByTagName('w:tbl');
  const genTables = genDoc.getElementsByTagName('w:tbl');

  console.log(`Tables: Gold=${goldTables.length}, Gen=${genTables.length}\n`);

  for (let s = 0; s < Math.min(goldTables.length, genTables.length); s++) {
    const gTbl = goldTables[s];
    const aTbl = genTables[s];
    const gTrs = gTbl.getElementsByTagName('w:tr');
    const aTrs = aTbl.getElementsByTagName('w:tr');

    const diffs = [];

    if (gTrs.length !== aTrs.length) {
      diffs.push(`Row count mismatch: Gold=${gTrs.length}, Gen=${aTrs.length}`);
    }

    for (let r = 0; r < Math.max(gTrs.length, aTrs.length); r++) {
      const gTr = gTrs[r];
      const aTr = aTrs[r];
      if (!gTr) {
        diffs.push(`Row ${r}: Missing in Gold, Present in Gen [${aTr.textContent.replace(/\s+/g, ' ').substring(0, 40)}]`);
        continue;
      }
      if (!aTr) {
        diffs.push(`Row ${r}: Present in Gold, Missing in Gen [${gTr.textContent.replace(/\s+/g, ' ').substring(0, 40)}]`);
        continue;
      }

      const gTcs = gTr.getElementsByTagName('w:tc');
      const aTcs = aTr.getElementsByTagName('w:tc');

      if (gTcs.length !== aTcs.length) {
        diffs.push(`Row ${r}: tc count mismatch (Gold=${gTcs.length}, Gen=${aTcs.length})`);
      }

      for (let c = 0; c < Math.max(gTcs.length, aTcs.length); c++) {
        const gTc = gTcs[c];
        const aTc = aTcs[c];
        if (!gTc || !aTc) continue;

        const gPs = gTc.getElementsByTagName('w:p');
        const aPs = aTc.getElementsByTagName('w:p');

        if (gPs.length !== aPs.length) {
          diffs.push(`Row ${r} Col ${c}: Paragraph count mismatch (Gold=${gPs.length}, Gen=${aPs.length})`);
        }

        for (let pIdx = 0; pIdx < Math.max(gPs.length, aPs.length); pIdx++) {
          const gP = gPs[pIdx];
          const aP = aPs[pIdx];
          if (!gP || !aP) {
            diffs.push(`Row ${r} Col ${c} p[${pIdx}]: ${gP ? 'Exists in Gold' : 'Exists in Gen'}`);
            continue;
          }

          const gText = gP.textContent;
          const aText = aP.textContent;

          // Check text difference
          if (gText.trim() !== aText.trim()) {
            diffs.push(`Row ${r} Col ${c} p[${pIdx}] TEXT:\n   Gold: "${gText.trim().substring(0, 50)}"\n   Gen : "${aText.trim().substring(0, 50)}"`);
          }

          // Check indent
          const gInd = gP.getElementsByTagName('w:ind')[0];
          const aInd = aP.getElementsByTagName('w:ind')[0];
          const gL = gInd?.getAttribute('w:left') || '';
          const aL = aInd?.getAttribute('w:left') || '';
          const gH = gInd?.getAttribute('w:hanging') || '';
          const aH = aInd?.getAttribute('w:hanging') || '';
          const gF = gInd?.getAttribute('w:firstLine') || '';
          const aF = aInd?.getAttribute('w:firstLine') || '';

          if (gL !== aL || gH !== aH || gF !== aF) {
            diffs.push(`Row ${r} Col ${c} p[${pIdx}] INDENT:\n   Gold: left="${gL}" hanging="${gH}" firstLine="${gF}"\n   Gen : left="${aL}" hanging="${aH}" firstLine="${aF}"\n   Text: "${gText.trim().substring(0, 30)}"`);
          }

          // Check alignment
          const gJc = gP.getElementsByTagName('w:jc')[0]?.getAttribute('w:val') || '';
          const aJc = aP.getElementsByTagName('w:jc')[0]?.getAttribute('w:val') || '';
          if (gJc !== aJc) {
            diffs.push(`Row ${r} Col ${c} p[${pIdx}] ALIGN (jc):\n   Gold: "${gJc}" vs Gen: "${aJc}"\n   Text: "${gText.trim().substring(0, 30)}"`);
          }

          // Check bold
          function isRunBold(r) {
            const b = r.getElementsByTagName('w:b')[0];
            if (!b) return false;
            const val = b.getAttribute('w:val');
            return val !== '0' && val !== 'false';
          }
          const gRuns = gP.getElementsByTagName('w:r');
          const aRuns = aP.getElementsByTagName('w:r');
          const gBold = Array.from(gRuns).some(isRunBold);
          const aBold = Array.from(aRuns).some(isRunBold);
          if (gBold !== aBold) {
            diffs.push(`Row ${r} Col ${c} p[${pIdx}] BOLD: Gold=${gBold} vs Gen=${aBold} ["${gText.trim().substring(0, 30)}"]`);
          }
        }
      }
    }

    if (diffs.length > 0) {
      console.log(`==================== SECTION ${s + 1} (${diffs.length} Differences) ====================`);
      diffs.forEach(d => console.log(`* ${d}`));
      console.log('');
    } else {
      console.log(`==================== SECTION ${s + 1}: 100% PERFECT MATCH ====================\n`);
    }
  }
}

main().catch(console.error);
