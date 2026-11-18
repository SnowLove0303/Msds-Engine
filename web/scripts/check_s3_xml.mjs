import JSZip from 'jszip';
import fs from 'node:fs/promises';

async function checkS3Xml() {
  const targetDir = 'E:/冠志/TDS MSDS (2)/待处理文件/PU-2346A';
  for (const f of ['PU-2346A msds_CN 冠志.docx', 'PU-2346A msds_EN Guanzhi.docx']) {
    console.log(`\n=================== ${f} ===================`);
    const buf = await fs.readFile(`${targetDir}/${f}`);
    const zip = await JSZip.loadAsync(buf);
    const xml = await zip.file('word/document.xml').async('text');
    const tbls = xml.match(/<w:tbl[\s\S]*?<\/w:tbl>/g) || [];
    const tbl3 = tbls[2];
    const trs = tbl3.match(/<w:tr[\s\S]*?<\/w:tr>/g) || [];
    console.log('Row 1 XML:\n', trs[1]);
    console.log('Row 2 XML:\n', trs[2]);
  }
}

checkS3Xml().catch(console.error);
