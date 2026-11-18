import fs from 'node:fs/promises';

async function search() {
  const content = await fs.readFile('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/pipeline-engine.js', 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    if (/Section 11/i.test(line)) {
      console.log(`${idx + 1}: ${line}`);
    }
  });
}

search();
