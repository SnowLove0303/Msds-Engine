import fs from 'fs';
import JSZip from 'jszip';
import { JSDOM } from 'jsdom';

async function auditDocxTypography(docxPath, isEn) {
  console.log(`\n======================================================`);
  console.log(`AUDITING TYPOGRAPHY: ${docxPath}`);
  console.log(`======================================================`);
  
  const buf = fs.readFileSync(docxPath);
  const zip = await JSZip.loadAsync(buf);
  const xml = await zip.file('word/document.xml').async('text');
  const dom = new JSDOM(xml, { contentType: 'application/xml' });
  const doc = dom.window.document;

  const tbls = Array.from(doc.getElementsByTagName('w:tbl'));
  console.log(`Found ${tbls.length} tables`);

  for (let tIdx = 0; tIdx < tbls.length; tIdx++) {
    const tbl = tbls[tIdx];
    const trs = Array.from(tbl.getElementsByTagName('w:tr'));
    const firstRowText = trs[0]?.textContent?.trim() || '';
    console.log(`\n--- Table ${tIdx + 1} (Rows: ${trs.length}) | Header: "${firstRowText.slice(0, 40)}" ---`);

    for (let rIdx = 0; rIdx < trs.length; rIdx++) {
      const tr = trs[rIdx];
      const tcs = Array.from(tr.getElementsByTagName('w:tc'));
      for (let cIdx = 0; cIdx < tcs.length; cIdx++) {
        const tc = tcs[cIdx];
        const ps = Array.from(tc.getElementsByTagName('w:p'));
        for (let pIdx = 0; pIdx < ps.length; pIdx++) {
          const p = ps[pIdx];
          const runs = Array.from(p.getElementsByTagName('w:r'));
          if (runs.length === 0) continue;

          const runDetails = runs.map((r, i) => {
            const t = r.getElementsByTagName('w:t')[0]?.textContent || '';
            const rPr = r.getElementsByTagName('w:rPr')[0];
            const isBold = Boolean(rPr && (rPr.getElementsByTagName('w:b').length > 0));
            const sz = rPr?.getElementsByTagName('w:sz')[0]?.getAttribute('w:val') || 'default';
            const rFonts = rPr?.getElementsByTagName('w:rFonts')[0];
            const fontAscii = rFonts?.getAttribute('w:ascii') || '';
            const fontEastAsia = rFonts?.getAttribute('w:eastAsia') || '';
            return `[r${i}: "${t}" | sz=${sz} | b=${isBold} | fonts=${fontAscii}/${fontEastAsia}]`;
          });

          // Print row/col if interesting
          const pText = p.textContent.trim();
          if (pText) {
            console.log(`  [R${rIdx}C${cIdx}P${pIdx}] ${runDetails.join(' ')}`);
          }
        }
      }
    }
  }
}

async function run() {
  await auditDocxTypography('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/12 水性噁唑啉交联剂 OX/OS-8970/OS-8970 msds_CN 冠志.docx', false);
  await auditDocxTypography('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/12 水性噁唑啉交联剂 OX/OS-8970/OS-8970 msds_EN Guanzhi.docx', true);
}

run().catch(console.error);
