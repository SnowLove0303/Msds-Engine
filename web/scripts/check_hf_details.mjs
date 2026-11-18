import fs from 'fs';
import jszip from 'jszip';

async function checkHf(filePath, label) {
  const buf = fs.readFileSync(filePath);
  const zip = await jszip.loadAsync(buf);
  console.log(`\n=== ${label} Header/Footer ===`);
  for (const name of Object.keys(zip.files)) {
    if (name.startsWith('word/header') || name.startsWith('word/footer')) {
      const xml = await zip.files[name].async('string');
      // strip XML tags
      const text = xml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      console.log(`  [${name}]: ${text}`);
    }
  }
}

async function main() {
  const src = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料/4-2 水性环氧固化剂 EC/EC-1804/EC-1804 msds_CN 冠志(1).docx';
  const cn = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/04-2 水性环氧固化剂 EC/EC-1804/EC-1804 msds_CN 冠志.docx';
  const en = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/04-2 水性环氧固化剂 EC/EC-1804/EC-1804 msds_EN Guanzhi.docx';
  await checkHf(src, 'SOURCE');
  await checkHf(cn, 'CN OUT');
  await checkHf(en, 'EN OUT');
}
main().catch(console.error);
