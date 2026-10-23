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

  const tbls = xml.match(/<w:tbl[\s\S]*?<\/w:tbl>/g) || [];
  const s12Tbl = tbls[11];
  if (s12Tbl) {
    console.log('=== Section 12 Table ===');
    const rows = s12Tbl.match(/<w:tr[\s\S]*?<\/w:tr>/g) || [];
    rows.forEach((r, idx) => {
      const text = r.replace(/<[^>]+>/g, '').trim();
      console.log(`Row ${idx}: ${text}`);
    });
  }
}

run().catch(console.error);
