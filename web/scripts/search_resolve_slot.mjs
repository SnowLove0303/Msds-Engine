import fs from 'node:fs';

const content = fs.readFileSync('web/src/smart-matching.js', 'utf8');
const lines = content.split('\n');
lines.forEach((line, idx) => {
  if (line.includes('resolveSlotBySemantics') || line.includes('product_name') && idx < 1000) {
    console.log(`${idx + 1}: ${line.trim()}`);
  }
});
