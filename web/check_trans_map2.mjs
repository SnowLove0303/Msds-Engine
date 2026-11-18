import fs from 'fs';

const map = JSON.parse(fs.readFileSync('src/translation-map.json', 'utf8'));
console.log('=== section_2_hazards ===');
console.log(JSON.stringify(map.section_2_hazards, null, 2).slice(0, 1500));
console.log('=== section_11_toxicology ===');
console.log(JSON.stringify(map.section_11_toxicology, null, 2).slice(0, 1500));
