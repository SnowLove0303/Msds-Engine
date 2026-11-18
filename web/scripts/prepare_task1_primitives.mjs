import fs from 'fs';

let code = fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/universal-editor-primitives.js', 'utf8');

// 1. labelCell ps loop
const old1 = `          const ps = Array.from(labelCell.getElementsByTagNameNS(W_NS, 'p'));
          for (const p of ps) {
            const pPr = p.getElementsByTagNameNS(W_NS, 'pPr')[0];`;
const new1 = `          const ps = Array.from(labelCell.getElementsByTagNameNS(W_NS, 'p'));
          for (const p of ps) {
            // 全局物理清除段落级自动编号定义 (REQ-S3-DUP-PURGE)
            const numPrs = Array.from(p.getElementsByTagNameNS(W_NS, 'numPr'));
            numPrs.forEach(n => n.parentNode?.removeChild(n));
            const pPr = p.getElementsByTagNameNS(W_NS, 'pPr')[0];`;
if (!code.includes(old1)) { console.error('old1 not found'); process.exit(1); }
code = code.replace(old1, new1);

// 2. cell ps loop
const old2 = `        const ps = Array.from(cell.getElementsByTagNameNS(W_NS, 'p'));
        for (const p of ps) {
          const pPr = p.getElementsByTagNameNS(W_NS, 'pPr')[0];`;
const new2 = `        const ps = Array.from(cell.getElementsByTagNameNS(W_NS, 'p'));
        for (const p of ps) {
          // 全局物理清除段落级自动编号定义 (REQ-S3-DUP-PURGE)
          const numPrs = Array.from(p.getElementsByTagNameNS(W_NS, 'numPr'));
          numPrs.forEach(n => n.parentNode?.removeChild(n));
          const pPr = p.getElementsByTagNameNS(W_NS, 'pPr')[0];`;
if (!code.includes(old2)) { console.error('old2 not found'); process.exit(1); }
code = code.replace(old2, new2);

fs.writeFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/scripts/universal_primitives_proposed.js', code, 'utf8');
console.log('Successfully prepared universal_primitives_proposed.js');
