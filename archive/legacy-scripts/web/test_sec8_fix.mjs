import fs from 'fs';
import JSZip from 'jszip';
import { DOMParser, XMLSerializer } from '@xmldom/xmldom';

async function testFix(docxPath, isEnglish = false) {
  const buf = fs.readFileSync(docxPath);
  const zip = await JSZip.loadAsync(buf);
  const xml = await zip.file('word/document.xml').async('text');
  const doc = new DOMParser().parseFromString(xml, 'text/xml');
  const W_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
  const tables = doc.getElementsByTagName('w:tbl');
  let sec8 = tables[7];
  const rows = sec8.getElementsByTagName('w:tr');

  const targetSz = isEnglish ? '19' : '24';
  const targetFont = isEnglish ? 'Arial' : '宋体';
  const targetBold = !isEnglish; // Chinese values are bold=true in all other sections

  for (let r = 2; r < rows.length; r++) {
    const cells = rows[r].getElementsByTagName('w:tc');
    if (cells.length < 2) continue;
    const vCell = cells[cells.length - 1];
    const runs = Array.from(vCell.getElementsByTagNameNS(W_NS, 'r'));
    for (const run of runs) {
      let rPr = run.getElementsByTagNameNS(W_NS, 'rPr')[0];
      if (!rPr) {
        rPr = doc.createElementNS(W_NS, 'w:rPr');
        run.insertBefore(rPr, run.firstChild);
      }
      
      // Update sz and szCs
      let sz = rPr.getElementsByTagNameNS(W_NS, 'sz')[0];
      if (!sz) {
        sz = doc.createElementNS(W_NS, 'w:sz');
        rPr.appendChild(sz);
      }
      sz.setAttributeNS(W_NS, 'w:val', targetSz);

      let szCs = rPr.getElementsByTagNameNS(W_NS, 'szCs')[0];
      if (!szCs) {
        szCs = doc.createElementNS(W_NS, 'w:szCs');
        rPr.appendChild(szCs);
      }
      szCs.setAttributeNS(W_NS, 'w:val', targetSz);

      // Update font
      let rFonts = rPr.getElementsByTagNameNS(W_NS, 'rFonts')[0];
      if (!rFonts) {
        rFonts = doc.createElementNS(W_NS, 'w:rFonts');
        rPr.appendChild(rFonts);
      }
      rFonts.setAttributeNS(W_NS, 'w:ascii', targetFont);
      rFonts.setAttributeNS(W_NS, 'w:hAnsi', targetFont);
      rFonts.setAttributeNS(W_NS, 'w:eastAsia', targetFont);
      rFonts.setAttributeNS(W_NS, 'w:cs', targetFont);

      // Update bold
      const bNodes = Array.from(rPr.getElementsByTagNameNS(W_NS, 'b'));
      bNodes.forEach(b => rPr.removeChild(b));
      const bCsNodes = Array.from(rPr.getElementsByTagNameNS(W_NS, 'bCs'));
      bCsNodes.forEach(b => rPr.removeChild(b));

      if (targetBold) {
        const bNode = doc.createElementNS(W_NS, 'w:b');
        rPr.appendChild(bNode);
      }
    }
  }

  // Dump verification
  console.log(`=== Verification for ${docxPath} (isEnglish=${isEnglish}) ===`);
  for (let r = 2; r < rows.length; r++) {
    const cells = rows[r].getElementsByTagName('w:tc');
    if (cells.length < 2) continue;
    const vCell = cells[cells.length - 1];
    const runs = vCell.getElementsByTagName('w:r');
    const runInfo = [];
    for (let k = 0; k < runs.length; k++) {
      const rNode = runs[k];
      const rPr = rNode.getElementsByTagName('w:rPr')[0];
      const sz = rPr?.getElementsByTagName('w:sz')[0]?.getAttribute('w:val');
      const b = rPr?.getElementsByTagName('w:b').length > 0;
      const font = rPr?.getElementsByTagName('w:rFonts')[0]?.getAttribute('w:eastAsia') || rPr?.getElementsByTagName('w:rFonts')[0]?.getAttribute('w:ascii');
      const t = rNode.getElementsByTagName('w:t')[0]?.textContent || '';
      runInfo.push(`[${JSON.stringify(t)}: sz=${sz}, bold=${b}, font=${font}]`);
    }
    console.log(`  Row ${r+1} (${cells[0].textContent.trim().slice(0, 12)}): ${runInfo.join(' ')}`);
  }
}

console.log('Testing Chinese deliverable fix:');
await testFix('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/04-1 水性环氧树脂 EP/EP-1736/EP-1736 msds_CN 冠志.docx', false);

console.log('\nTesting English deliverable fix:');
await testFix('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/04-1 水性环氧树脂 EP/EP-1736/EP-1736 msds_EN Guanzhi.docx', true);
