import fs from 'fs';
const pe = fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/pipeline-engine.js', 'utf8');
console.log('pe has targetChem replacement?', pe.includes('translateChemicalTerm(targetChem)'));
console.log('pe has Species: Rabbit?', pe.includes('Species: Rabbit'));
