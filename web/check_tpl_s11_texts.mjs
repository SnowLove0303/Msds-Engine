import JSZip from 'jszip';
import fs from 'fs';

async function main() {
  const buf = fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/public/templates/正式模板_MSDS_EN_冠志(1).docx');
  const zip = await JSZip.loadAsync(buf);
  const xml = await zip.file('word/document.xml').async('text');
  
  const idx = xml.indexOf('Toxicity information');
  const piece = xml.substring(idx, idx + 15000);
  
  // Extract all text tags in order
  const texts = [];
  const tMatches = piece.match(/<w:t[\s\S]*?>([\s\S]*?)<\/w:t>/g) || [];
  tMatches.forEach(t => texts.push(t.replace(/<[^>]+>/g, '')));
  console.log(texts.join(' | '));
}
main().catch(console.error);
