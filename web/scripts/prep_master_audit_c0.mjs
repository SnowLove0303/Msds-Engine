import fs from 'node:fs/promises';

async function main() {
  const filePath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/scripts/run_master_msds_audit.mjs';
  let content = await fs.readFile(filePath, 'utf8');

  const oldBlock = `    for (let r = 1; r < trs.length; r++) {
      const c0 = trs[r].getElementsByTagName('w:tc')[0];
      if (!c0) continue;
      const szs = c0.getElementsByTagName('w:sz');`;

  const newBlock = `    for (let r = 1; r < trs.length; r++) {
      const c0 = trs[r].getElementsByTagName('w:tc')[0];
      if (!c0 || !c0.textContent.trim()) continue;
      const szs = c0.getElementsByTagName('w:sz');`;

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
