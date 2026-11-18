import fs from 'fs';

const code = fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/pipeline-engine.js', 'utf8');
const lines = code.split('\n');
console.log('--- 2420-2480 ---');
console.log(lines.slice(2420, 2480).join('\n'));

console.log('--- 3970-3990 ---');
console.log(lines.slice(3970, 3990).join('\n'));
