import fs from 'node:fs/promises';

async function updateSmartMatching() {
  const file = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/smart-matching.js';
  let content = await fs.readFile(file, 'utf8');
  content = content.replace(/\r\n/g, '\n');

  // 将所有 applyStandardHangingIndent(..., '457', '457', '459') 替换为 applyStandardHangingIndent(..., '420', '420')
  const count = (content.match(/applyStandardHangingIndent\(([^,]+),\s*'457',\s*'457',\s*'459'\)/g) || []).length;
  console.log(`Found ${count} occurrences of '457', '457', '459' in smart-matching.js`);

  content = content.replace(/applyStandardHangingIndent\(([^,]+),\s*'457',\s*'457',\s*'459'\)/g, "applyStandardHangingIndent($1, '420', '420')");

  await fs.writeFile('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/scratch/smart-matching.proposed_semantic.js', content, 'utf8');
  console.log('Successfully written scratch/smart-matching.proposed_semantic.js');
}
updateSmartMatching();
