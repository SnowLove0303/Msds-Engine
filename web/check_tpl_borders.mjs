import JSZip from 'jszip';
import fs from 'fs';

async function main() {
  const p = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/public/templates/正式模板_MSDS_CN_冠志(1).docx';
  const buf = fs.readFileSync(p);
  const zip = await JSZip.loadAsync(buf);
  const xml = await zip.file('word/document.xml').async('text');
  
  const tbls = xml.match(/<w:tbl[\s\S]*?<\/w:tbl>/g) || [];
  console.log(`Found ${tbls.length} tables in CN template.`);
  tbls.forEach((tbl, i) => {
    const tblBorders = tbl.match(/<w:tblBorders[\s\S]*?<\/w:tblBorders>/)?.[0] || 'NONE';
    console.log(`Table ${i} tblBorders:`, tblBorders);
  });
}
main().catch(console.error);
