import JSZip from 'jszip';
import fs from 'fs';

const tplCn = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/public/templates/正式模板_MSDS_CN_冠志(1).docx';
const tplEn = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/public/templates/正式模板_MSDS_EN_冠志(1).docx';

async function sanitizeTemplateFooter(filePath) {
  const buf = fs.readFileSync(filePath);
  const zip = await JSZip.loadAsync(buf);
  for (const name of Object.keys(zip.files)) {
    if (name.includes('footer')) {
      let xml = await zip.file(name).async('text');
      if (xml.includes('w:firstLine="8730"')) {
        xml = xml.replace(/<w:ind\s+w:firstLine="8730"\s+w:firstLineChars="4850"\s*\/>/g, '');
        zip.file(name, xml);
        console.log(`Cleaned 8730 indent in ${filePath} -> ${name}`);
      }
    }
  }
  const outBuf = await zip.generateAsync({ type: 'nodebuffer' });
  fs.writeFileSync(filePath, outBuf);
}

async function run() {
  await sanitizeTemplateFooter(tplCn);
  await sanitizeTemplateFooter(tplEn);
  console.log('Templates footer sanitization complete.');
}

run().catch(console.error);
