import fs from 'fs';
import JSZip from 'jszip';

async function checkDocx(filePath) {
  const buf = fs.readFileSync(filePath);
  const zip = await JSZip.loadAsync(buf);
  const xml = await zip.file('word/document.xml').async('text');
  return { xml, zip };
}

async function run() {
  const userPath = 'D:/冠志/TDS MSDS/1-1 单组份水性聚氨酯树脂 PU/PU-202A/PU-202A msds_CN 冠志_用户手工修改基准.docx';
  const { xml, zip } = await checkDocx(userPath);

  console.log('=== 用户基准的页脚 Footers ===');
  for (const f of ['word/footer1.xml', 'word/footer2.xml', 'word/footer3.xml']) {
    const file = zip.file(f);
    if (file) {
      const fXml = await file.async('text');
      const textMatches = fXml.match(/<w:t[^>]*>([^<]*)<\/w:t>/g) || [];
      console.log(`${f}: ` + textMatches.map(t => t.replace(/<[^>]+>/g, '')).join(' | '));
    }
  }

  console.log('\n=== 用户基准的 固体含量 Row ===');
  const match922 = xml.match(/(?:9\.\d+|固体含量)[^<]*<\/w:t>[\s\S]*?(?=<\/w:tr>)/i);
  if (match922) {
    console.log(match922[0].slice(0, 1000));
  }

  console.log('\n=== 用户基准的 Section 11 ===');
  // 找 11.毒性资料
  const s11Idx = xml.indexOf('11.毒性资料');
  if (s11Idx !== -1) {
    const s11Xml = xml.slice(s11Idx, s11Idx + 5000);
    const rows = s11Xml.match(/<w:tr[\s\S]*?<\/w:tr>/g) || [];
    rows.forEach((r, idx) => {
      const texts = (r.match(/<w:t[^>]*>([^<]*)<\/w:t>/g) || []).map(t => t.replace(/<[^>]+>/g, '')).join('');
      console.log(`Row ${idx}: ${texts}`);
    });
  }

  console.log('\n=== 用户基准的 Section 12 ===');
  const s12Idx = xml.indexOf('12.生态学资料');
  if (s12Idx !== -1) {
    const s12Xml = xml.slice(s12Idx, s12Idx + 5000);
    const rows = s12Xml.match(/<w:tr[\s\S]*?<\/w:tr>/g) || [];
    rows.forEach((r, idx) => {
      const texts = (r.match(/<w:t[^>]*>([^<]*)<\/w:t>/g) || []).map(t => t.replace(/<[^>]+>/g, '')).join('');
      console.log(`Row ${idx}: ${texts}`);
    });
  }
}

run().catch(console.error);
