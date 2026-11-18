import fs from 'node:fs';
import JSZip from 'jszip';

async function main() {
  const p = '算法训练材料/源文件材料/2-1 单组份水性丙烯酸乳液 PA/PA-3653/PA-3653 MSDS（冠志）.docx';
  const buf = fs.readFileSync(p);
  const zip = await JSZip.loadAsync(buf);
  const xml = await zip.file('word/document.xml').async('text');
  const tbls = xml.split(/<\/w:tbl>/);
  console.log('Tables count:', tbls.length - 1);
  tbls.slice(0, -1).forEach((t, i) => {
    const text = t.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    console.log(`Table ${i} text:`, text.slice(0, 150));
  });
}

main().catch(console.error);
