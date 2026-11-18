import JSZip from 'jszip';
import fs from 'node:fs/promises';
import path from 'node:path';

async function inspect() {
  const targetDir = 'E:/冠志/TDS MSDS (2)/待处理文件/PU-2346A';
  for (const f of ['PU-2346A msds_CN 冠志.docx', 'PU-2346A msds_EN Guanzhi.docx']) {
    console.log(`\n=================== ${f} ===================`);
    const buf = await fs.readFile(path.join(targetDir, f));
    const zip = await JSZip.loadAsync(buf);
    const xml = await zip.file('word/document.xml').async('text');
    const tbls = xml.match(/<w:tbl[\s\S]*?<\/w:tbl>/g) || [];

    // Table 3 (Section 3)
    console.log('--- Section 3 Rows ---');
    const tbl3 = tbls[2];
    const trs3 = tbl3.match(/<w:tr[\s\S]*?<\/w:tr>/g) || [];
    trs3.forEach((tr, idx) => {
      const tcs = tr.match(/<w:tc[\s\S]*?<\/w:tc>/g) || [];
      const texts = tcs.map(tc => tc.replace(/<[^>]+>/g, '').trim());
      console.log(`  Row ${idx}: ${JSON.stringify(texts)}`);
    });

    // Table 11 (Section 11)
    console.log('--- Section 11 Label Indents & Texts ---');
    const tbl11 = tbls[10]; // Table 11
    const trs11 = tbl11.match(/<w:tr[\s\S]*?<\/w:tr>/g) || [];
    trs11.forEach((tr, idx) => {
      const tcs = tr.match(/<w:tc[\s\S]*?<\/w:tc>/g) || [];
      const c0 = tcs[0] || '';
      const text = c0.replace(/<[^>]+>/g, '').trim();
      const ind = c0.match(/<w:ind[^>]*\/>/)?.[0] || 'no-ind';
      if (text.includes('11.7') || text.includes('11.1') || idx < 5) {
        console.log(`  Row ${idx}: [${text}] -> ind: ${ind}`);
      }
    });
  }
}

inspect().catch(console.error);
