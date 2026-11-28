import fs from 'fs';

const txt = fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/pipeline-engine.js', 'utf8');
const lines = txt.split('\n');

lines.forEach((l, i) => {
  if (l.includes('derivePresetEngines')) {
    console.log((i+1) + ': ' + l);
  }
});
