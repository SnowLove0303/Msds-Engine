import JSZip from 'jszip';
import fs from 'fs';

async function main() {
  const p = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/06-1 水分散型异氰酸酯固化剂 OS/OS-9547 PGDA80/OS-9547 PGDA80 msds_CN 冠志.docx';
  const buf = fs.readFileSync(p);
  const zip = await JSZip.loadAsync(buf);
  const xml = await zip.file('word/document.xml').async('text');
  
  const s3Match = xml.match(/<w:tbl[\s\S]*?3\.[\s\S]*?成分[\s\S]*?<\/w:tbl>/);
  if (!s3Match) {
    console.log('No S3 table matched');
    return;
  }
  const s3Xml = s3Match[0];
  const trs = s3Xml.match(/<w:tr[\s\S]*?<\/w:tr>/g) || [];
  console.log(`S3 has ${trs.length} rows.`);
  trs.forEach((tr, idx) => {
    const borders = tr.match(/<w:tcBorders[\s\S]*?<\/w:tcBorders>/g) || [];
    const tblPrEx = tr.match(/<w:tblBorders[\s\S]*?<\/w:tblBorders>/g) || [];
    const text = (tr.match(/<w:t[\s\S]*?>([\s\S]*?)<\/w:t>/g) || []).map(t => t.replace(/<[^>]+>/g, '')).join(' | ');
    console.log(`\nRow ${idx}: ${text}`);
    if (tblPrEx.length) console.log(`  tblPrEx borders:`, tblPrEx[0]);
    if (borders.length) console.log(`  tcBorders count=${borders.length}, sample:`, borders[0]);
  });
}
main().catch(console.error);
