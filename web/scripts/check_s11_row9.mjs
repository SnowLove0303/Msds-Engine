import JSZip from 'jszip';
import fs from 'node:fs/promises';

async function checkS11Row9() {
  const targetDir = 'E:/冠志/TDS MSDS (2)/待处理文件/PU-2346A';
  const buf = await fs.readFile(`${targetDir}/PU-2346A msds_CN 冠志.docx`);
  const zip = await JSZip.loadAsync(buf);
  const xml = await zip.file('word/document.xml').async('text');
  const tbls = xml.match(/<w:tbl[\s\S]*?<\/w:tbl>/g) || [];
  const tbl11 = tbls[10];
  const trs = tbl11.match(/<w:tr[\s\S]*?<\/w:tr>/g) || [];
  trs.forEach((tr, idx) => {
    if (tr.includes('11.7')) {
      console.log(`\n=== Section 11 Row ${idx} (11.7) ===\n`, tr);
    }
  });
}

checkS11Row9().catch(console.error);
