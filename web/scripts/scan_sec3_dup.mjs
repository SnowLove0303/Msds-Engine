import JSZip from 'jszip';
import fs from 'node:fs/promises';
import path from 'node:path';

async function scanDuplicateSeq() {
  const root = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版';
  const dirs = await fs.readdir(root, { recursive: true });
  const docxs = dirs.filter(f => f.includes('msds_') && f.endsWith('.docx'));
  for (const rel of docxs) {
    const full = path.join(root, rel);
    try {
      const buf = await fs.readFile(full);
      const zip = await JSZip.loadAsync(buf);
      const xml = await zip.file('word/document.xml').async('text');
      const tbls = xml.match(/<w:tbl[\s\S]*?<\/w:tbl>/g) || [];
      const tbl3 = tbls[2];
      if (!tbl3) continue;
      const trs3 = tbl3.match(/<w:tr[\s\S]*?<\/w:tr>/g) || [];
      trs3.forEach((tr, rIdx) => {
        const text = tr.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        if (/3\.1.*3\.1|3\.2.*3\.2|产品类型.*产品类型|成分.*成分/i.test(text)) {
          console.log(`[DUPLICATE in ${path.basename(full)}] Row ${rIdx}: ${text}`);
        }
      });
    } catch (e) {}
  }
}

scanDuplicateSeq().catch(console.error);
