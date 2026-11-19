import fs from 'fs';

const origPath = 'web/src/universal-editor-primitives.js';
const origContent = fs.readFileSync(origPath, 'utf8');
const normalized = origContent.replace(/\r\n/g, '\n');

// Target 1: line 760-763
const target1Old = `          if (kvMatch || s15Match || s11Match) {
            const match = kvMatch || s15Match || s11Match;
            const labelText = (match[1].replace(/[:：\\s.]+$/, '') + (isEnglish ? ': ' : '：')).trim() + (isEnglish ? ' ' : '');
            const valText = match[2]?.trim() || '';`;

const target1New = `          if (kvMatch || s15Match || s11Match) {
            const match = kvMatch || s15Match || s11Match;
            const valText = match[2]?.trim() || '';
            let labelText = (match[1].replace(/[:：\\s.]+$/, '') + (isEnglish ? ':' : '：')).trim();
            if (isEnglish && valText) {
              labelText += ' ';
            }`;

// Target 2: lines 874-878
const target2Old = `              const isColHeader = (rIdx <= 4) && /^(?:Chemical\\s*name|Components?|CAS\\s*NO\\.?|Concentration\\s*%\\s*\\(w\\/w\\)|Basis|Type|Value)$/i.test(tc.trim());
              if (rIdx > 0 && !isColHeader && tc.length > 15 && !/[.!?:]$/.test(tc) && !/\\b(?:min|mm|CAS|EC|No|N\\/A|None|Concentration|w\\/w)\\.?$/i.test(tc)) {
                tc = tc + '.';
              }`;

const target2New = `              const trimmed = tc.trim();
              const isColHeader = (rIdx <= 4) && /^(?:Chemical\\s*name|Components?|CAS\\s*NO\\.?|Concentration\\s*%\\s*\\(w\\/w\\)|Basis|Type|Value)$/i.test(trimmed);
              const isLabelHeader = /[:：]$/.test(trimmed) || (sectionNumber === 15 && /^(?:Other provisions|Complies with the following regulations)/i.test(trimmed));
              if (rIdx > 0 && !isColHeader && !isLabelHeader && trimmed.length > 15 && !/[.!?:]$/.test(trimmed) && !/\\b(?:min|mm|CAS|EC|No|N\\/A|None|Concentration|w\\/w)\\.?$/i.test(trimmed)) {
                tc = trimmed + '.';
              }
              tc = tc.replace(/[:：]\\s*\\./g, ':');`;

if (!normalized.includes(target1Old)) {
  console.error('Target 1 Old not found!');
  process.exit(1);
}
if (!normalized.includes(target2Old)) {
  console.error('Target 2 Old not found!');
  process.exit(1);
}

let newContent = normalized.replace(target1Old, target1New);
newContent = newContent.replace(target2Old, target2New);

const isCRLF = origContent.includes('\r\n');
const finalContent = isCRLF ? newContent.replace(/\n/g, '\r\n') : newContent;

const propPath = 'web/src/universal-editor-primitives.proposed.js';
fs.writeFileSync(propPath, finalContent, 'utf8');
console.log('Successfully created ' + propPath);
