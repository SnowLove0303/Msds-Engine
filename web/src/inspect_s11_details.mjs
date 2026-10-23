import fs from 'fs';
import JSZip from 'jszip';

async function checkDocx(filePath) {
  const buf = fs.readFileSync(filePath);
  const zip = await JSZip.loadAsync(buf);
  const xml = await zip.file('word/document.xml').async('text');
  return { xml, zip };
}

async function run() {
  const cnPath = 'D:/冠志/TDS MSDS/1-1 单组份水性聚氨酯树脂 PU/PU-202A/PU-202A msds_CN 冠志.docx';
  const { xml } = await checkDocx(cnPath);

  // 找 Section 11 表格
  const pos = xml.indexOf('11.毒性资料');
  const tblEnd = xml.indexOf('</w:tbl>', pos);
  const s11Xml = xml.slice(pos, tblEnd);

  const rows = s11Xml.match(/<w:tr[\s\S]*?<\/w:tr>/g) || [];
  rows.forEach((r, idx) => {
    const tcs = r.match(/<w:tc[\s\S]*?<\/w:tc>/g) || [];
    const tc0 = tcs[0] ? tcs[0].replace(/<[^>]+>/g, '').trim() : '';
    const tc1 = tcs[1] ? tcs[1].replace(/<[^>]+>/g, '').trim() : '';
    console.log(`[Row ${idx}]`);
    console.log(`  tc0: ${tc0}`);
    console.log(`  tc1: ${tc1.slice(0, 80)}`);
  });
}

run().catch(console.error);
