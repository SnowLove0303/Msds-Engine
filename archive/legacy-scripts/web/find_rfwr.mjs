import fs from 'fs';

for (const f of ['src/docx-engine.js', 'src/pipeline-engine.js']) {
  const content = fs.readFileSync(f, 'utf8');
  const lines = content.split('\n');
  lines.forEach((l, i) => {
    if (l.includes('renderFullWidthRow')) {
      console.log(`${f}:${i+1}: ${l.trim().slice(0, 90)}`);
    }
  });
}
