import JSZip from 'jszip';
import fs from 'node:fs/promises';
import path from 'node:path';

async function scanSec3() {
  const root = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版';
  const dirs = await fs.readdir(root, { recursive: true });
  const docxs = dirs.filter(f => f.includes('msds_') && f.endsWith('.docx')).slice(0, 10);
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
      const r1 = (trs3[1]?.match(/<w:tc[\s\S]*?<\/w:tc>/g) || [])[0]?.replace(/<[^>]+>/g, '').trim();
      const r2 = (trs3[2]?.match(/<w:tc[\s\S]*?<\/w:tc>/g) || [])[0]?.replace(/<[^>]+>/g, '').trim();
      console.log(`${path.basename(full)}:`);
      console.log(`   Row 1: "${r1}" | Row 2: "${r2}"`);
    } catch (e) {}
  }
}

scanSec3().catch(console.error);
