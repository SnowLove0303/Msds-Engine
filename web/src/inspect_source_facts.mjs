import fs from 'fs';
import JSZip from 'jszip';

async function checkDocx(filePath) {
  const buf = fs.readFileSync(filePath);
  const zip = await JSZip.loadAsync(buf);
  const xml = await zip.file('word/document.xml').async('text');
  return { xml, zip };
}

async function run() {
  const srcPath = 'D:/冠志/TDS MSDS/1-1 单组份水性聚氨酯树脂 PU/PU-202A/PU-202A msds_CN 国彩_源文件留存.docx';
  const { xml, zip } = await checkDocx(srcPath);

  console.log('=== 源文件的页脚 Footers ===');
  for (const f of ['word/footer1.xml', 'word/footer2.xml', 'word/footer3.xml']) {
    const file = zip.file(f);
    if (file) {
      const fXml = await file.async('text');
      const textMatches = fXml.match(/<w:t[^>]*>([^<]*)<\/w:t>/g) || [];
      console.log(`${f}: ` + textMatches.map(t => t.replace(/<[^>]+>/g, '')).join(' | '));
    }
  }

  console.log('\n=== 源文件中的日期检索 ===');
  const dateMatches = xml.match(/(?:日期|生效|修订|审核|编制)[^\n<]*[\d]{4}[^\n<]*/g) || [];
  console.log('Date matches in doc:', dateMatches);

  console.log('\n=== 源文件中的 Section 12 ===');
  const s12Match = xml.match(/12[\.、\s]*生态学[\s\S]*?(?=13[\.、\s]*废弃)/i);
  if (s12Match) {
    const texts = (s12Match[0].match(/<w:t[^>]*>([^<]*)<\/w:t>/g) || []).map(t => t.replace(/<[^>]+>/g, ''));
    console.log('S12 full text:', texts.join(''));
  }

  console.log('\n=== 源文件中的 固体含量 ===');
  const solidMatch = xml.match(/固体含量[\s\S]*?(?=<\/w:tr>)/i);
  if (solidMatch) {
    const texts = (solidMatch[0].match(/<w:t[^>]*>([^<]*)<\/w:t>/g) || []).map(t => t.replace(/<[^>]+>/g, ''));
    console.log('Solid row:', texts.join(' | '));
  }

  console.log('\n=== 源文件中的 生殖毒性与附加信息 ===');
  const s11Match = xml.match(/11[\.、\s]*毒理[\s\S]*?(?=12[\.、\s]*生态)/i);
  if (s11Match) {
    const texts = (s11Match[0].match(/<w:t[^>]*>([^<]*)<\/w:t>/g) || []).map(t => t.replace(/<[^>]+>/g, ''));
    console.log('S11 text snippet:');
    const s11Joined = texts.join('');
    const posRep = s11Joined.indexOf('生殖');
    if (posRep !== -1) console.log(s11Joined.slice(posRep - 20, posRep + 300));
  }
}

run().catch(console.error);
