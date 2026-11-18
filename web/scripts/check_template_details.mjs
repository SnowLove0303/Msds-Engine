import JSZip from 'jszip';
import fs from 'fs';
import { DOMParser } from '@xmldom/xmldom';

const tplEn = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/public/templates/正式模板_MSDS_EN_冠志(1).docx';
const tplCn = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/public/templates/正式模板_MSDS_CN_冠志(1).docx';

async function checkTemplate(file, name) {
  console.log(`=== ${name} ===`);
  const zip = await JSZip.loadAsync(fs.readFileSync(file));
  const docXml = await zip.file('word/document.xml').async('text');
  const doc = new DOMParser().parseFromString(docXml, 'text/xml');

  // Print Section 9 rows in template
  const trs = doc.getElementsByTagName('w:tr');
  for (let i = 0; i < trs.length; i++) {
    const txt = trs[i].textContent?.trim() || '';
    if (txt.includes('Physical') || txt.includes('Appearance') || txt.includes('Density') || txt.includes('Flash') || txt.includes('外观') || txt.includes('密度')) {
      console.log(`  Row ${i}:`, txt.replace(/\s+/g, ' '));
    }
    if (txt.includes('Special precautions') || txt.includes('14.4') || txt.includes('Temperature') || txt.includes('特殊注意事项')) {
      console.log(`  S14 Row ${i}:`, txt.replace(/\s+/g, ' '));
    }
  }

  // Print footer1.xml
  if (zip.file('word/footer1.xml')) {
    const ftr = await zip.file('word/footer1.xml').async('text');
    console.log(`  Footer1 Indent:`, ftr.match(/<w:ind[^>]+>/g));
  }
}

async function run() {
  await checkTemplate(tplCn, 'CN Template');
  await checkTemplate(tplEn, 'EN Template');
}

run().catch(console.error);
