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
  const { xml, zip } = await checkDocx(cnPath);
  console.log('Document loaded, length:', xml.length);

  // 1. 查找 9.22 固体含量
  const match922 = xml.match(/(?:9\.\d+|固体含量)[^<]*<\/w:t>[\s\S]*?(?=<\/w:tr>)/i);
  if (match922) {
    console.log('=== 1. 9.22 固体含量 Row ===');
    console.log(match922[0].slice(0, 1000));
  }

  // 2. 查找 11.7 生殖 与 11.9 附加信息
  console.log('\n=== 2. Section 11 matches ===');
  const s11Match = xml.match(/<w:tbl[\s\S]*?11\.1[\s\S]*?<\/w:tbl>/);
  if (s11Match) {
    const rows = s11Match[0].match(/<w:tr[\s\S]*?<\/w:tr>/g) || [];
    rows.forEach((r, idx) => {
      const texts = (r.match(/<w:t[^>]*>([^<]*)<\/w:t>/g) || []).map(t => t.replace(/<[^>]+>/g, '')).join('');
      console.log(`Row ${idx}: ${texts}`);
    });
  }

  // 3. 查找 Section 12 说明行
  console.log('\n=== 3. Section 12 rows ===');
  const s12Match = xml.match(/<w:tbl[\s\S]*?12\.1[\s\S]*?<\/w:tbl>/);
  if (s12Match) {
    const rows = s12Match[0].match(/<w:tr[\s\S]*?<\/w:tr>/g) || [];
    rows.forEach((r, idx) => {
      const texts = (r.match(/<w:t[^>]*>([^<]*)<\/w:t>/g) || []).map(t => t.replace(/<[^>]+>/g, '')).join('');
      console.log(`Row ${idx}: ${texts}`);
    });
  }

  // 4. 检查页尾时间
  console.log('\n=== 4. Footers ===');
  const footerFiles = ['word/footer1.xml', 'word/footer2.xml', 'word/footer3.xml'];
  for (const f of footerFiles) {
    const file = zip.file(f);
    if (file) {
      const fXml = await file.async('text');
      const textMatches = fXml.match(/<w:t[^>]*>([^<]*)<\/w:t>/g) || [];
      console.log(`${f}: ` + textMatches.map(t => t.replace(/<[^>]+>/g, '')).join(' | '));
    }
  }
}

run().catch(console.error);
