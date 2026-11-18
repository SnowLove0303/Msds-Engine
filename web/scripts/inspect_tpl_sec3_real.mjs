import JSZip from 'jszip';
import fs from 'node:fs/promises';

async function inspectTpl() {
  const tpls = [
    'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/public/templates/正式模板_MSDS_CN_冠志(1).docx',
    'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/public/templates/正式模板_MSDS_EN_冠志(1).docx'
  ];
  for (const tpl of tpls) {
    console.log(`\n=== TEMPLATE ${tpl.split('/').pop()} Section 3 ===`);
    const buf = await fs.readFile(tpl);
    const zip = await JSZip.loadAsync(buf);
    const xml = await zip.file('word/document.xml').async('text');
    const tbls = xml.match(/<w:tbl[\s\S]*?<\/w:tbl>/g) || [];
    const tbl3 = tbls[2];
    const trs3 = tbl3.match(/<w:tr[\s\S]*?<\/w:tr>/g) || [];
    trs3.forEach((tr, idx) => {
      const tcs = tr.match(/<w:tc[\s\S]*?<\/w:tc>/g) || [];
      const texts = tcs.map(tc => tc.replace(/<[^>]+>/g, '').trim());
      console.log(`Tpl Row ${idx}: ${JSON.stringify(texts)}`);
    });
  }
}

inspectTpl().catch(console.error);
