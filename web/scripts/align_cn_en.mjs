import fs from 'fs';

const enLines = fs.readFileSync('C:/Users/Administrator/.gemini/antigravity/brain/7f4d4b46-78e6-435a-aa29-f0d6ec194caa/scratch/en_lines.txt', 'utf8').split('\n');
const cnLines = fs.readFileSync('C:/Users/Administrator/.gemini/antigravity/brain/7f4d4b46-78e6-435a-aa29-f0d6ec194caa/scratch/cn_lines.txt', 'utf8').split('\n');
const srcLines = fs.readFileSync('C:/Users/Administrator/.gemini/antigravity/brain/7f4d4b46-78e6-435a-aa29-f0d6ec194caa/scratch/src_lines.txt', 'utf8').split('\n');

const comparison = [];
const maxLen = Math.max(cnLines.length, enLines.length);

for (let i = 0; i < maxLen; i++) {
  const cn = cnLines[i] || '[MISSING CN]';
  const en = enLines[i] || '[MISSING EN]';
  comparison.push(`--- LINE ${i + 1} ---`);
  comparison.push(`[CN] ${cn}`);
  comparison.push(`[EN] ${en}`);
  comparison.push('');
}

fs.writeFileSync('C:/Users/Administrator/.gemini/antigravity/brain/7f4d4b46-78e6-435a-aa29-f0d6ec194caa/scratch/aligned_cn_en.txt', comparison.join('\n'), 'utf8');
console.log('Saved aligned_cn_en.txt with', maxLen, 'lines');
