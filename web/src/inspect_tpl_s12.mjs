import fs from 'fs';
import JSZip from 'jszip';

async function checkDocx(filePath) {
  const buf = fs.readFileSync(filePath);
  const zip = await JSZip.loadAsync(buf);
  const xml = await zip.file('word/document.xml').async('text');
  return { xml, zip };
}

async function run() {
  const tplPath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/public/templates/正式模板_MSDS_CN_冠志(1).docx';
  const { xml } = await checkDocx(tplPath);

  const tbls = xml.match(/<w:tbl[\s\S]*?<\/w:tbl>/g) || [];
  tbls.forEach((tbl, tIdx) => {
    const text = tbl.replace(/<[^>]+>/g, '');
    if (text.includes('12.') || text.includes('生态')) {
      console.log(`\n=== Template Table ${tIdx} ===`);
      const rows = tbl.match(/<w:tr[\s\S]*?<\/w:tr>/g) || [];
      rows.forEach((r, rIdx) => {
        const tcs = r.match(/<w:tc[\s\S]*?<\/w:tc>/g) || [];
        const t0 = tcs[0] ? tcs[0].replace(/<[^>]+>/g, '').trim() : '';
        const t1 = tcs[1] ? tcs[1].replace(/<[^>]+>/g, '').trim() : '';
        console.log(`  Row ${rIdx}: [${t0}] | [${t1.slice(0, 60)}]`);
      });
    }
  });
}

run().catch(console.error);
