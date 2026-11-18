import fs from 'fs';

const p = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/audit/legal-invariants-oracle.json';
const oracle = JSON.parse(fs.readFileSync(p, 'utf8'));

console.log("Current Oracle Invariants Count:", oracle.invariants.length);
oracle.invariants.forEach(inv => {
  console.log(`- ${inv.id}: ${inv.title}`);
});
