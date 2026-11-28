import JSZip from 'jszip';
import fs from 'fs';

async function main() {
  const buf = fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/06-1 水分散型异氰酸酯固化剂 OS/OS-9547 PGDA80/OS-9547 PGDA80 msds_EN Guanzhi.docx');
  const zip = await JSZip.loadAsync(buf);
  const xml = await zip.file('word/document.xml').async('text');
  
  const m1 = xml.match(/orga[\s\S]{1,50}toxicity/g);
  console.log('orga toxicity match:', m1);
  const m3 = xml.match(/repeate[\s\S]{1,50}exposure/g);
  console.log('repeate exposure match:', m3);

  // Check section 11 table XML in detail
  const s11Xml = xml.match(/<w:tbl[\s\S]*?11\.Toxicity[\s\S]*?<\/w:tbl>/)?.[0] || '';
  console.log('S11 XML text extracts:');
  const tMatches = (s11Xml.match(/<w:t[\s\S]*?>([\s\S]*?)<\/w:t>/g) || []).map(t => t.replace(/<[^>]+>/g, ''));
  console.log(tMatches);
}
main().catch(console.error);
