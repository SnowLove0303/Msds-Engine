import JSZip from 'jszip';
import fs from 'fs';
import { JSDOM } from 'jsdom';

const dom = new JSDOM();
const DOMParser = dom.window.DOMParser;

async function inspectDocx(filePath) {
  const buf = fs.readFileSync(filePath);
  const zip = await JSZip.loadAsync(buf);
  const xml = await zip.file('word/document.xml').async('text');
  const doc = new DOMParser().parseFromString(xml, 'application/xml');
  return { xml, doc };
}

async function main() {
  const targetPath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/01-1 单组份水性聚氨酯树脂 PU/PU-218A/PU-218A msds_CN 冠志.docx';
  const sourcePath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料/1-1 单组份水性聚氨酯树脂 PU/PU-218A/PU-218A msds_CN 冠志.docx';

  console.log('Inspecting output CN Guanzhi...');
  const { doc: outDoc, xml: outXml } = await inspectDocx(targetPath);
  const { doc: srcDoc, xml: srcXml } = await inspectDocx(sourcePath);

  const tables = outDoc.getElementsByTagName('w:tbl');
  console.log('Total tables in output:', tables.length);

  for (let i = 0; i < tables.length; i++) {
    const tbl = tables[i];
    const text = tbl.textContent;
    
    // Check Section 2
    if (text.includes('危险性概述') || text.includes('危害识别') || text.includes('GHS')) {
      console.log(`\n=== Table ${i} is Section 2 ===`);
      const drawings = tbl.getElementsByTagName('w:drawing');
      console.log('Drawings count in Sec 2:', drawings.length);
      for (let d = 0; d < drawings.length; d++) {
        let p = drawings[d].parentNode;
        while (p && p.tagName !== 'w:p') p = p.parentNode;
        if (p) {
          const jc = p.getElementsByTagName('w:jc')[0];
          console.log(`Drawing ${d} parent paragraph jc:`, jc ? jc.getAttribute('w:val') : 'none');
        }
      }
      const ps = tbl.getElementsByTagName('w:p');
      for (let pIdx = 0; pIdx < ps.length; pIdx++) {
        const p = ps[pIdx];
        const pText = p.textContent.trim();
        const pPr = p.getElementsByTagName('w:pPr')[0];
        const sp = pPr ? pPr.getElementsByTagName('w:spacing')[0] : null;
        const before = sp ? sp.getAttribute('w:before') : null;
        if (pText.includes('2.') || pText.includes('防范') || pText.includes('警示') || pText.includes('危险')) {
          console.log(`Sec 2 P[${pIdx}]: "${pText}" | spacing before=${before}`);
        }
      }
    }

    // Check Section 11
    if (text.includes('毒理学信息') || text.includes('毒理学资料') || text.includes('11.7') || text.includes('生殖毒性') || text.includes('急性毒性')) {
      console.log(`\n=== Table ${i} is Section 11 ===`);
      const rows = tbl.getElementsByTagName('w:tr');
      console.log('Section 11 total rows:', rows.length);
      for (let r = 0; r < rows.length; r++) {
        const row = rows[r];
        const cells = row.getElementsByTagName('w:tc');
        const rowTexts = Array.from(cells).map(c => c.textContent.trim());
        const spans = Array.from(cells).map(c => {
          const gridSpan = c.getElementsByTagName('w:gridSpan')[0];
          const vMerge = c.getElementsByTagName('w:vMerge')[0];
          return `span=${gridSpan ? gridSpan.getAttribute('w:val') : 1},vMerge=${vMerge ? (vMerge.getAttribute('w:val') || 'continue') : 'none'}`;
        });
        console.log(`Sec 11 Row ${r} (cells=${cells.length}): [${rowTexts.join(' | ')}] | [${spans.join(' ; ')}]`);
      }
    }

    // Check Section 9
    if (text.includes('理化特性') || text.includes('外观与性状') || text.includes('pH') || text.includes('沸点')) {
      console.log(`\n=== Table ${i} is Section 9 ===`);
      const rows = tbl.getElementsByTagName('w:tr');
      console.log('Section 9 total rows:', rows.length);
      for (let r = 0; r < Math.min(8, rows.length); r++) {
        const cells = rows[r].getElementsByTagName('w:tc');
        const rowTexts = Array.from(cells).map(c => c.textContent.trim());
        console.log(`Sec 9 Row ${r}: [${rowTexts.join(' | ')}]`);
      }
    }

    // Check Section 13
    if (text.includes('废弃处置') || text.includes('处置方法')) {
      console.log(`\n=== Table ${i} is Section 13 ===`);
      const rows = tbl.getElementsByTagName('w:tr');
      for (let r = 0; r < rows.length; r++) {
        const cells = rows[r].getElementsByTagName('w:tc');
        const rowTexts = Array.from(cells).map(c => c.textContent.trim());
        console.log(`Sec 13 Row ${r}: [${rowTexts.join(' | ')}]`);
      }
    }
  }
}

main().catch(err => { console.error(err); process.exit(1); });
