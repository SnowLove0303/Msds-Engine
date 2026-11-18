import fs from 'fs';
const audit = fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/tests/proposed_audit_bipolar_bilayer.mjs', 'utf8');

console.log('has 960/840?', audit.includes('left="960/840"'));
console.log('has tblsCn[1] in S2?', audit.includes('const s2Ps = Array.from(tblsCn[1].getElementsByTagName'));
