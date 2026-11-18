import JSZip from 'jszip';
import fs from 'fs';

async function main() {
  const buf = fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/public/templates/正式模板_MSDS_EN_冠志(1).docx');
  const zip = await JSZip.loadAsync(buf);
  const xml = await zip.file('word/document.xml').async('text');
  
  const m1 = xml.match(/orga[\s\S]{1,50}toxicity/g);
  console.log('Template orga toxicity match:', m1);
  const m2 = xml.match(/repeate[\s\S]{1,50}exposure/g);
  console.log('Template repeate exposure match:', m2);

  // Print all section 11 rows in template
  const s11Xml = xml.match(/<w:tbl[\s\S]*?11\.Toxicity[\s\S]*?<\/w:tbl>/)?.[0] || '';
  const rows = s11Xml.match(/<w:tr[\s\S]*?<\/w:tr>/g) || [];
  rows.forEach((r, i) => {
    const t = (r.match(/<w:t[\s\S]*?>([\s\S]*?)<\/w:t>/g) || []).map(x => x.replace(/<[^>]+>/g, '')).join(' | ');
    console.log(`Tpl S11 Row ${i}: ${t}`);
  });
}
main().catch(console.error);
