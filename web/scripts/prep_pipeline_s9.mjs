import fs from 'node:fs/promises';

async function main() {
  const filePath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/pipeline-engine.js';
  let content = await fs.readFile(filePath, 'utf8');

  const oldTarget = `  if (!isEn) {
    const allTables = Array.from(doc.getElementsByTagNameNS(W_NS, 'tbl'));
    for (const tbl of allTables) {
      const trs = Array.from(tbl.getElementsByTagNameNS(W_NS, 'tr'));`;

  const newTarget = `  if (!isEn) {
    const allTables = Array.from(doc.getElementsByTagNameNS(W_NS, 'tbl'));
    for (const tbl of allTables) {
      const tblText = tbl.textContent || '';
      if (tblText.includes('物理和化学特性') || tblText.includes('理化特性')) continue; // G-38 专属激光垂线对齐豁免 (序号 10.5pt, 标签 12pt)
      const trs = Array.from(tbl.getElementsByTagNameNS(W_NS, 'tr'));`;

  const normalizedContent = content.replace(/\r\n/g, '\n');
  const normalizedOld = oldTarget.replace(/\r\n/g, '\n');
  const normalizedNew = newTarget.replace(/\r\n/g, '\n');

  if (!normalizedContent.includes(normalizedOld)) {
    console.error('Target not found in pipeline-engine.js!');
    process.exit(1);
  }

  const updated = normalizedContent.replace(normalizedOld, normalizedNew);
  await fs.writeFile('C:/Users/Administrator/.gemini/antigravity/brain/7f4d4b46-78e6-435a-aa29-f0d6ec194caa/scratch/pipeline-engine-proposed.js', updated);
  console.log('Successfully generated pipeline-engine-proposed.js');
}
main();
