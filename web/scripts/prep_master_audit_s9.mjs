import fs from 'node:fs/promises';

async function main() {
  const filePath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/scripts/run_master_msds_audit.mjs';
  let content = await fs.readFile(filePath, 'utf8');

  const oldBlock = `  for (let t = 0; t < tblsCn.length; t++) {
    const trs = tblsCn[t].getElementsByTagName('w:tr');`;

  const newBlock = `  for (let t = 0; t < tblsCn.length; t++) {
    const tblText = tblsCn[t].textContent || '';
    if (tblText.includes('物理和化学特性') || tblText.includes('理化特性')) continue; // Section 9 遵循 G-38 激光垂线对齐豁免 (序号 10.5pt, 标签 12pt)
    const trs = tblsCn[t].getElementsByTagName('w:tr');`;

  const normalizedContent = content.replace(/\r\n/g, '\n');
  const normalizedOld = oldBlock.replace(/\r\n/g, '\n');
  const normalizedNew = newBlock.replace(/\r\n/g, '\n');

  if (!normalizedContent.includes(normalizedOld)) {
    console.error('Target block not found in run_master_msds_audit.mjs!');
    process.exit(1);
  }

  let updated = normalizedContent.replace(normalizedOld, normalizedNew);

  await fs.writeFile('C:/Users/Administrator/.gemini/antigravity/brain/7f4d4b46-78e6-435a-aa29-f0d6ec194caa/scratch/run_master_msds_audit-proposed.mjs', updated);
  console.log('Successfully generated run_master_msds_audit-proposed.mjs');
}
main();
