import fs from 'fs';

const code = fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/produce_ep_five_models.mjs', 'utf8');
const lines = code.split('\n');

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('section2') || lines[i].includes('section 2') || lines[i].includes('buildFullWidth') || lines[i].includes('Section 15') || lines[i].includes('Table 15') || lines[i].includes('t15') || lines[i].includes('t2')) {
    console.log(`${i+1}: ${lines[i]}`);
  }
}
