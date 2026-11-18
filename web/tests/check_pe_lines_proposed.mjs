import fs from 'fs';
const pe = fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/tests/proposed_pipeline_engine.js', 'utf8');
const lines = pe.split('\n');

for (let i = 3210; i < 3240; i++) {
  console.log(`${i+1}: ${lines[i]}`);
}
