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

  console.log('=== 1. 检查 9.22 固体含量格式 ===');
  const match922 = xml.match(/<w:tr[^>]*>[\s\S]*?固体含量[\s\S]*?<\/w:tr>/i);
  if (match922) {
    const rowXml = match922[0];
    const indMatch = rowXml.match(/<w:ind[^>]*\/>/);
    const tabMatch = rowXml.match(/<w:tabs>[\s\S]*?<\/w:tabs>/);
    const textNodes = (rowXml.match(/<w:t[^>]*>([^<]*)<\/w:t>/g) || []).map(t => t.replace(/<[^>]+>/g, ''));
    console.log('9.22 Texts:', textNodes.join(' | '));
    console.log('9.22 Indent:', indMatch ? indMatch[0] : 'None');
    console.log('9.22 Tabs:', tabMatch ? tabMatch[0] : 'None');
  }

  console.log('\n=== 2. 检查 Section 11 (生殖毒性与附加信息) ===');
  const s11Match = xml.match(/<w:tbl[\s\S]*?11\.1[\s\S]*?<\/w:tbl>/);
  if (s11Match) {
    const rows = s11Match[0].match(/<w:tr[\s\S]*?<\/w:tr>/g) || [];
    rows.forEach((r, idx) => {
      const texts = (r.match(/<w:t[^>]*>([^<]*)<\/w:t>/g) || []).map(t => t.replace(/<[^>]+>/g, '')).join('');
      if (texts.includes('生殖') || texts.includes('附加') || texts.includes('11.7') || texts.includes('11.9')) {
        console.log(`Row ${idx}: ${texts}`);
      }
    });
  }

  console.log('\n=== 3. 检查 Section 12 说明行 ===');
  const s12Match = xml.match(/<w:tbl[\s\S]*?12\.1[\s\S]*?<\/w:tbl>/);
  if (s12Match) {
    const rows = s12Match[0].match(/<w:tr[\s\S]*?<\/w:tr>/g) || [];
    rows.forEach((r, idx) => {
      const texts = (r.match(/<w:t[^>]*>([^<]*)<\/w:t>/g) || []).map(t => t.replace(/<[^>]+>/g, '')).join('');
      console.log(`Row ${idx}: ${texts}`);
    });
  }

  console.log('\n=== 4. 检查 页尾时间 ===');
  for (const f of ['word/footer1.xml', 'word/footer2.xml', 'word/footer3.xml']) {
    const file = zip.file(f);
    if (file) {
      const fXml = await file.async('text');
      const textMatches = fXml.match(/<w:t[^>]*>([^<]*)<\/w:t>/g) || [];
      console.log(`${f}: ` + textMatches.map(t => t.replace(/<[^>]+>/g, '')).join(' | '));
    }
  }
}

run().catch(console.error);
