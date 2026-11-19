import fs from 'node:fs';

function searchFile(filePath, regex) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    if (regex.test(line)) {
      console.log(`${filePath}:${idx + 1}: ${line.trim()}`);
    }
  });
}

searchFile('web/src/pipeline-engine.js', /中文名称|sec1\.product_name|fillSection1|buildSection1/i);
searchFile('web/src/docx-engine.js', /中文名称|1\.1\s*产品名称|sec1/i);
