import JSZip from 'jszip';
import fs from 'fs';

async function inspect(p, lbl) {
  console.log(`=== ${lbl} ===`);
  const buf = fs.readFileSync(p);
  const zip = await JSZip.loadAsync(buf);
  for (const [name, file] of Object.entries(zip.files)) {
    if (name.includes('header1') || name.includes('footer1')) {
      const xml = await file.async('string');
      const text = xml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      console.log(`  [${name}] ${text}`);
      // Check font sizes
      const szMatches = xml.match(/<w:sz w:val="(\d+)"/g) || [];
      const uniqueSz = [...new Set(szMatches.map(m => m.match(/\d+/)[0]))].map(v => `${v/2}pt`);
      console.log(`    Unique font sizes: ${uniqueSz.join(', ')}`);
    }
  }
}

async function main() {
  const dir = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/01-2 水性羟基聚氨酯树脂 HPU/HPU-7651';
  await inspect(`${dir}/HPU-7651 msds_CN 冠志.docx`, 'DELIVERABLE_CN_GUANZHI');
  await inspect(`${dir}/HPU-7651 msds_CN 国彩.docx`, 'DELIVERABLE_CN_GUOCAI');
  await inspect(`${dir}/HPU-7651 msds_EN Guanzhi.docx`, 'DELIVERABLE_EN_GUANZHI');
  await inspect(`${dir}/HPU-7651 msds_EN Guocai.docx`, 'DELIVERABLE_EN_GUOCAI');
}

main().catch(console.error);
