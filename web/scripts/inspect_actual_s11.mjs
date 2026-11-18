import fs from 'fs';
import JSZip from 'jszip';

async function checkActual() {
  const zip = await JSZip.loadAsync(fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/PU-202A/PU-202A msds_CN 冠志.docx'));
  const xml = await zip.file('word/document.xml').async('text');
  const tbls = xml.match(/<w:tbl[\s\S]*?<\/w:tbl>/g) || [];
  const s11 = tbls[10];
  const trs = s11.match(/<w:tr[\s\S]*?<\/w:tr>/g) || [];
  console.log('Total rows in S11:', trs.length);
  trs.forEach((tr, rIdx) => {
    const tcs = tr.match(/<w:tc[\s\S]*?<\/w:tc>/g) || [];
    console.log(`\n=== Row ${rIdx} (cells: ${tcs.length}) ===`);
    tcs.forEach((tc, cIdx) => {
      const ps = tc.match(/<w:p[\s\S]*?<\/w:p>/g) || [];
      console.log(`  Cell ${cIdx} (paras: ${ps.length}):`);
      ps.forEach((p, pIdx) => {
        const ind = (p.match(/<w:ind[^>]*\/>/) || [''])[0];
        const jc = (p.match(/<w:jc[^>]*\/>/) || [''])[0];
        const runs = p.match(/<w:r[\s\S]*?<\/w:r>/g) || [];
        const rTxt = runs.map(r => {
          const isB = /<w:b(\/|\s[^>]*\/)?>/.test(r);
          const sz = (r.match(/<w:sz\s+w:val="(\d+)"\/>/) || ['', ''])[1];
          const t = (r.match(/<w:t[^>]*>(.*?)<\/w:t>/) || ['', ''])[1];
          const br = /<w:br\/>/.test(r) ? '[BR]' : '';
          return `${isB ? '[B]' : ''}${sz ? `[sz:${sz}]` : ''}${t}${br}`;
        }).join('');
        console.log(`    P${pIdx} [ind:${ind}] -> ${rTxt}`);
      });
    });
  });
}
checkActual().catch(console.error);
