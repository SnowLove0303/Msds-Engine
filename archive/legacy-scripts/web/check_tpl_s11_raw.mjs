import JSZip from 'jszip';
import fs from 'fs';

async function main() {
  const buf = fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/public/templates/正式模板_MSDS_EN_冠志(1).docx');
  const zip = await JSZip.loadAsync(buf);
  const xml = await zip.file('word/document.xml').async('text');
  
  // Search for 11. in template
  const idx = xml.indexOf('11.Toxicity');
  console.log('Index of 11.Toxicity:', idx);
  if (idx !== -1) {
    console.log(xml.substring(idx - 100, idx + 2000));
  } else {
    // Find all occurrences of Toxicity
    const idx2 = xml.indexOf('Toxicity');
    console.log('Index of Toxicity:', idx2);
    if (idx2 !== -1) {
      console.log(xml.substring(idx2 - 100, idx2 + 2000));
    }
  }
}
main().catch(console.error);
