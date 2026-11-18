import fs from 'fs';

const content = fs.readFileSync('src/pipeline-engine.js', 'utf8');
const lines = content.split('\n');
const targets = ['function translateToxicologyValueToEnglish', 'translateToxicologyValueToEnglish'];

lines.forEach((line, idx) => {
  for (const t of targets) {
    if (line.includes(t)) {
      console.log(`${idx + 1}: ${line.trim().slice(0, 100)}`);
      break;
    }
  }
});


