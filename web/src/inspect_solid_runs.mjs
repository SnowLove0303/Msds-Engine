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

  // 找 Row 9.1 和 Row 9.22
  const r91 = xml.match(/<w:tr[\s\S]*?9\.1[\s\S]*?<\/w:tr>/);
  const r922 = xml.match(/<w:tr[\s\S]*?固体含量[\s\S]*?<\/w:tr>/);

  if (r91) {
    console.log('=== Row 9.1 XML ===');
    console.log(r91[0]);
  }
  if (r922) {
    console.log('=== Row 9.22 XML ===');
    console.log(r922[0]);
  }
}

run().catch(console.error);
