import fs from 'fs';

const code = fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/pipeline-engine.js', 'utf8');

// 1. Check hand protection at 2435
const idx1 = code.indexOf('ind.setAttributeNS(W_NS, \'w:left\', \'420\');');
console.log('idx1:', idx1);

// 2. Check hand protection at 3975
const idx2 = code.indexOf('const handRowCn = s8Rec.rows.find');
console.log('idx2:', idx2);

// 3. Check Section 4 & 5 at 4225
const idx3 = code.indexOf('// 4. 全局中文标签单元格字号均一性加固');
console.log('idx3:', idx3);
