import fs from 'fs';

const filePath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/pipeline-engine.js';
const orig = fs.readFileSync(filePath, 'utf8');

const t = `      if (/合适的灭火剂/i.test(lbl)) {
        if (val.includes('大火时应用喷洒水') && !val.includes('大火时应用喷洒水。')) {
          val = val.replace(/大火时应用喷洒水(?![。])/g, '大火时应用喷洒水。');
          safeWriteCellValue(row.cells[1], val);
        }
      } else if (/不合适的灭火剂/i.test(lbl)) {
        if (val && !/[。！]$/.test(val)) {
          safeWriteCellValue(row.cells[1], val + '。');
        }
      }`;

const r = `      if (/不合适的灭火剂/i.test(lbl)) {
        if (val && !/[。！]$/.test(val)) {
          safeWriteCellValue(row.cells[1], val + '。');
        }
      } else if (/合适的灭火剂/i.test(lbl)) {
        if (val.includes('大火时应用喷洒水') && !val.includes('大火时应用喷洒水。')) {
          val = val.replace(/大火时应用喷洒水(?![。])/g, '大火时应用喷洒水。');
          safeWriteCellValue(row.cells[1], val);
        }
      }`;

function replaceBlock(str, target, repl) {
  if (str.includes(target)) return str.replace(target, repl);
  const targetCrlf = target.replace(/\n/g, '\r\n');
  const replCrlf = repl.replace(/\n/g, '\r\n');
  if (str.includes(targetCrlf)) return str.replace(targetCrlf, replCrlf);
  throw new Error(`Target not found: ${target.slice(0, 40)}...`);
}

const updated = replaceBlock(orig, t, r);
fs.writeFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/scripts/pipeline_engine_proposed.js', updated, 'utf8');
console.log('pipeline_engine_proposed.js created.');
