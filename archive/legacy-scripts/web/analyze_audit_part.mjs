import fs from 'fs';

const txt = fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/scratch/audit_5_sections.txt', 'utf8');

// Print Section 2
function printBetween(startMarker, endMarker) {
  const sIdx = txt.indexOf(startMarker);
  if (sIdx === -1) {
    console.log('NOT FOUND:', startMarker);
    return;
  }
  const eIdx = endMarker ? txt.indexOf(endMarker, sIdx + startMarker.length) : txt.length;
  console.log(txt.substring(sIdx, eIdx === -1 ? txt.length : eIdx));
}

console.log('--- SECTION 2 ---');
printBetween('SOURCE - SECTION 2', 'SOURCE - SECTION 3');
