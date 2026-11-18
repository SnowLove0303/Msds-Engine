import { recognizeSourceDocx } from 'file:///F:/App%20Location/Guanzhi%20Tong/Skill/MSDS-Engine/web/src/recognition-engine.js';

const sourcePath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料/1-1 单组份水性聚氨酯树脂 PU/PU-6088E/PU-6088E msds_CN 冠志.docx';

async function main() {
  const result = await recognizeSourceDocx(sourcePath);
  console.log('Recognized PU-6088E Sections:');
  for (const [secNum, secData] of Object.entries(result.sections || {})) {
    console.log(`\n--- Section ${secNum}: ${secData.title} ---`);
    if (secData.rows) {
      secData.rows.forEach((r, idx) => {
        const rowStr = r.cells.map(c => `[${c.isBold ? 'B:' : ''}${c.text.trim()}]`).join(' | ');
        console.log(`  Row ${idx}: ${rowStr}`);
      });
    }
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
