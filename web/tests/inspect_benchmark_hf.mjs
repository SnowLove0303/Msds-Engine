import JSZip from 'jszip';
import fs from 'fs';

async function inspectDocxHF(docxPath, label) {
  console.log(`\n=================== ${label} ===================`);
  const buf = fs.readFileSync(docxPath);
  const zip = await JSZip.loadAsync(buf);
  for (const [name, file] of Object.entries(zip.files)) {
    if (name.startsWith('word/header') || name.startsWith('word/footer')) {
      const xml = await file.async('string');
      console.log(`--- [${name}] ---`);
      // Parse runs and paragraphs with their font and size
      const pMatches = xml.match(/<w:p[\s\S]*?<\/w:p>/g) || [];
      for (const p of pMatches) {
        // extract pPr jc
        const jcMatch = p.match(/<w:jc w:val="([^"]+)"/);
        const jc = jcMatch ? jcMatch[1] : 'left';
        // extract all runs
        const rMatches = p.match(/<w:r[\s\S]*?<\/w:r>/g) || [];
        let pText = '';
        const runInfos = [];
        for (const r of rMatches) {
          const tMatches = r.match(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g) || [];
          const rText = tMatches.map(t => t.replace(/<[^>]+>/g, '')).join('');
          const fldMatch = r.match(/<w:instrText[^>]*>([\s\S]*?)<\/w:instrText>/);
          const fldText = fldMatch ? `[FLD: ${fldMatch[1].trim()}]` : '';
          const fullRText = rText + fldText;
          if (fullRText) {
            const szMatch = r.match(/<w:sz w:val="(\d+)"/);
            const sz = szMatch ? `${parseInt(szMatch[1]) / 2}pt` : 'default';
            const b = r.includes('<w:b/>') || r.includes('<w:b ');
            const fontMatch = r.match(/<w:rFonts[^>]*w:eastAsia="([^"]+)"/) || r.match(/<w:rFonts[^>]*w:ascii="([^"]+)"/);
            const font = fontMatch ? fontMatch[1] : 'default';
            runInfos.push(`{text: "${fullRText}", sz: ${sz}, b: ${b}, font: "${font}"}`);
            pText += fullRText;
          }
        }
        if (pText.trim()) {
          console.log(`  P (align=${jc}): "${pText.trim()}"`);
          console.log(`     Runs: ${runInfos.join(', ')}`);
        }
      }
    }
  }
}

async function main() {
  const dir = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/06-2 水性封闭型异氰酸酯固化剂 BL/BL-8129A';
  await inspectDocxHF(`${dir}/BL-8129A msds_CN 冠志.docx`, 'BENCHMARK_BL-8129A_CN_GUANZHI');
  await inspectDocxHF(`${dir}/BL-8129A msds_CN 国彩.docx`, 'BENCHMARK_BL-8129A_CN_GUOCAI');
  await inspectDocxHF(`${dir}/BL-8129A msds_EN Guanzhi.docx`, 'BENCHMARK_BL-8129A_EN_GUANZHI');
  await inspectDocxHF(`${dir}/BL-8129A msds_EN Guocai.docx`, 'BENCHMARK_BL-8129A_EN_GUOCAI');
}

main().catch(console.error);
