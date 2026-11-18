import fs from 'node:fs';
import JSZip from 'jszip';

async function check() {
  const p = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/04-2 水性环氧固化剂 EC/EC-1848/EC-1848 msds_CN 冠志.docx';
  if (!fs.existsSync(p)) {
    console.log('File not found:', p);
    return;
  }
  const buf = fs.readFileSync(p);
  const zip = await JSZip.loadAsync(buf);
  const xml = await zip.file('word/document.xml').async('text');
  
  // 查找 media 文件夹里的图片
  const mediaFiles = Object.keys(zip.files).filter(f => f.startsWith('word/media/'));
  console.log('Media files in EN docx:', mediaFiles);

  // 打印前 3 个表格文本
  const tblMatches = xml.match(/<w:tbl\b[\s\S]*?<\/w:tbl>/g) || [];
  console.log('Total tables in docx:', tblMatches.length);
  console.log('--- Table 9 ---');
  console.log(tblMatches[8].replace(/<w:tr\b[^>]*>/g, '\n[TR] ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' '));

  console.log('--- Table 14 ---');
  console.log(tblMatches[13].replace(/<w:tr\b[^>]*>/g, '\n[TR] ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' '));
}
check();
