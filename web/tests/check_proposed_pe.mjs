import fs from 'fs';
const pe = fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/tests/proposed_pipeline_engine.js', 'utf8');

console.log('pe has reproductive toxicity fix?', pe.includes('Animal experiments showed effects on the embryo'));
console.log('pe has pathology fix?', pe.includes('Pathological changes: kidney'));
console.log('pe has patch test fix?', pe.includes('Patch test on human volunteers demonstrated no sensitizing properties'));
