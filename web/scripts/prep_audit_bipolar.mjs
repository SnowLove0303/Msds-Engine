import fs from 'node:fs/promises';

async function main() {
  const filePath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/scripts/audit_bipolar_bilayer.mjs';
  let content = await fs.readFile(filePath, 'utf8');

  const oldBlock = `  // G-40 核心硬断言：无论是任何型号、任何危险类别，中英文 Section 2 必须 100% 恒为 2 行单单元格通栏！
  assert(s2Trs.length === 2, \`Section 2 中文版 (G-40): 必须严格收敛为 2 行极简通栏拓扑 (实测行数: \${s2Trs.length})\`);
  assert(s2Tcs.length === 1, \`Section 2 中文版 (G-40): 必须为单单元格通栏，严禁多列分列 (实测单元格数: \${s2Tcs.length})\`);
  assert(s2TrsEn.length === 2, \`Section 2 英文版 (G-40): 必须严格收敛为 2 行极简通栏拓扑 (实测行数: \${s2TrsEn.length})\`);
  assert(s2TcsEn.length === 1, \`Section 2 英文版 (G-40): 必须为单单元格通栏，严禁多列分列 (实测单元格数: \${s2TcsEn.length})\`);

  if (s2Tcs.length === 1 && s2Trs.length === 2) {
    const s2Text = s2Row1.textContent;`;

  const newBlock = `  // G-40 核心硬断言：中英文 Section 2 必须为 2 行或 5 行单单元格通栏 (REQ-01 多行豁免跨页防截断)
  assert(s2Trs.length === 2 || s2Trs.length === 5, \`Section 2 中文版 (G-40): 必须严格收敛为 2 行或 5 行极简通栏拓扑 (实测行数: \${s2Trs.length})\`);
  assert(Array.from(s2Trs).slice(1).every(r => r.getElementsByTagName('w:tc').length === 1), \`Section 2 中文版 (G-40): 必须为单单元格通栏，严禁多列分列\`);
  assert(s2TrsEn.length === 2 || s2TrsEn.length === 5, \`Section 2 英文版 (G-40): 必须严格收敛为 2 行或 5 行极简通栏拓扑 (实测行数: \${s2TrsEn.length})\`);
  assert(Array.from(s2TrsEn).slice(1).every(r => r.getElementsByTagName('w:tc').length === 1), \`Section 2 英文版 (G-40): 必须为单单元格通栏，严禁多列分列\`);

  if ((s2Trs.length === 2 || s2Trs.length === 5)) {
    const s2Text = Array.from(s2Trs).slice(1).map(r => r.textContent).join(' ');`;

  const normalizedContent = content.replace(/\r\n/g, '\n');
  const normalizedOld = oldBlock.replace(/\r\n/g, '\n');
  const normalizedNew = newBlock.replace(/\r\n/g, '\n');

  if (!normalizedContent.includes(normalizedOld)) {
    console.error('Target block not found in audit_bipolar_bilayer.mjs!');
    process.exit(1);
  }

  let updated = normalizedContent.replace(normalizedOld, normalizedNew);

  await fs.writeFile('C:/Users/Administrator/.gemini/antigravity/brain/7f4d4b46-78e6-435a-aa29-f0d6ec194caa/scratch/audit_bipolar_bilayer-proposed.mjs', updated);
  console.log('Successfully generated audit_bipolar_bilayer-proposed.mjs');
}
main();
