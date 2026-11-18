import fs from 'node:fs/promises';

async function updatePipelineEngine() {
  const file = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/pipeline-engine.js';
  let content = await fs.readFile(file, 'utf8');
  content = content.replace(/\r\n/g, '\n');

  const count = (content.match(/applyStandardHangingIndent\(([^,]+),\s*'457',\s*'457',\s*'459'\)/g) || []).length;
  console.log(`Found ${count} occurrences of '457', '457', '459' in pipeline-engine.js`);

  content = content.replace(/applyStandardHangingIndent\(([^,]+),\s*'457',\s*'457',\s*'459'\)/g, "applyStandardHangingIndent($1, '420', '420')");

  await fs.writeFile('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/scratch/pipeline-engine.proposed_semantic.js', content, 'utf8');
  console.log('Successfully written scratch/pipeline-engine.proposed_semantic.js');
}
updatePipelineEngine();
