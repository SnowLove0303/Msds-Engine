import fs from 'fs';

const content = fs.readFileSync('src/pipeline-engine.js.proposed', 'utf8');
const lines = content.split('\n');
const targets = ['isPu202', 'isPa3223', 'isPu608', 'isPu218', '羟基丙烯酸酯', 'Hydroxy polyacrylate'];

let count = 0;
lines.forEach((line, idx) => {
  for (const t of targets) {
    if (line.includes(t)) {
      console.log(`${idx + 1}: ${line.trim().slice(0, 100)}`);
      count++;
      break;
    }
  }
});
console.log('Total remaining occurrences:', count);
