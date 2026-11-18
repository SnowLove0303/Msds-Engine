import fs from 'node:fs';
import JSZip from 'jszip';
import { DOMParser } from '@xmldom/xmldom';

const files = [
  'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/PA-3223/PA-3223 msds_CN 冠志.docx',
  'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/PA-3223/PA-3223 msds_EN Guanzhi.docx'
];

async function inspect() {
  for (const f of files) {
    const filename = f.split('/').pop();
    console.log(`\n========================================================================`);
    console.log(`  FILE: ${filename}`);
    console.log(`========================================================================`);
    const zip = await JSZip.loadAsync(fs.readFileSync(f));
    const xml = await zip.file('word/document.xml').async('text');
    const doc = new DOMParser().parseFromString(xml, 'text/xml');
    const s11 = doc.getElementsByTagName('w:tbl')[10];
    const trs = s11.getElementsByTagName('w:tr');
    console.log(`Section 11 Table Row Count: ${trs.length}\n`);

    for (let r = 0; r < trs.length; r++) {
      const tcs = trs[r].getElementsByTagName('w:tc');
      console.log(`--- [Row ${r}] (${tcs.length} cells) ---`);
      for (let c = 0; c < tcs.length; c++) {
        const gridSpan = tcs[c].getElementsByTagName('w:gridSpan')[0]?.getAttribute('w:val');
        const tcW = tcs[c].getElementsByTagName('w:tcW')[0]?.getAttribute('w:w');
        const ps = tcs[c].getElementsByTagName('w:p');
        console.log(` Cell ${c}: gridSpan=${gridSpan || '1'}, width=${tcW || 'auto'}, paragraphs=${ps.length}`);

        for (let pIdx = 0; pIdx < ps.length; pIdx++) {
          const p = ps[pIdx];
          const pPr = p.getElementsByTagName('w:pPr')[0];
          const ind = pPr?.getElementsByTagName('w:ind')[0];
          const jc = pPr?.getElementsByTagName('w:jc')[0]?.getAttribute('w:val');
          const spacing = pPr?.getElementsByTagName('w:spacing')[0];
          const lineRule = spacing?.getAttribute('w:lineRule');
          const line = spacing?.getAttribute('w:line');

          const runs = p.getElementsByTagName('w:r');
          const brs = p.getElementsByTagName('w:br');

          let runDesc = [];
          for (let ri = 0; ri < runs.length; ri++) {
            const rNode = runs[ri];
            const t = rNode.getElementsByTagName('w:t')[0]?.textContent || '';
            const b = rNode.getElementsByTagName('w:b').length > 0;
            const sz = rNode.getElementsByTagName('w:sz')[0]?.getAttribute('w:val');
            const rFonts = rNode.getElementsByTagName('w:rFonts')[0];
            const ascii = rFonts?.getAttribute('w:ascii');
            const eastAsia = rFonts?.getAttribute('w:eastAsia');
            runDesc.push({ t, b, sz, ascii, eastAsia });
          }

          console.log(`  P${pIdx}: [brs=${brs.length}] jc=${jc || '-'} ind=(left=${ind?.getAttribute('w:left') || '-'}, hang=${ind?.getAttribute('w:hanging') || '-'}, first=${ind?.getAttribute('w:firstLine') || '-'}) lineSpacing=${line || '-'}`);
          console.log(`     Full Text: "${p.textContent}"`);
          console.log(`     Runs count: ${runDesc.length}`);
          runDesc.forEach((rd, idx) => {
            console.log(`       Run ${idx}: [bold=${rd.b}, sz=${rd.sz}, font=${rd.ascii}/${rd.eastAsia || '-'}] "${rd.t}"`);
          });
        }
      }
    }
  }
}

inspect().catch(console.error);
