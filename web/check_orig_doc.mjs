import fs from 'fs';

const origPath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/docs/MSDS交付物全景产物审计体系规范文档.md';
const origContent = fs.readFileSync(origPath, 'utf8');

console.log('Original length:', origContent.length);
console.log('Original line count:', origContent.split('\n').length);
