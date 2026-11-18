import fs from 'fs';

const filePath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/docx-engine.js';
const orig = fs.readFileSync(filePath, 'utf8');
const target = "const isEnDoc = /EN|English/i.test(partName) || engine?.headerFooterData?.language === 'en' || /_EN_|EN\\b/i.test(engine?.filename || '');";
const replacement = "const isEnDoc = /^en$/i.test(next.language || '') || /^en$/i.test(engine?.headerFooterData?.language || '') || /EN|English/i.test(partName) || /_EN_|EN\\b/i.test(engine?.filename || '');";

if (!orig.includes(target)) {
  console.error('Target not found in docx-engine.js!');
  process.exit(1);
}
const updated = orig.replace(target, replacement);
fs.writeFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/scripts/docx_engine_proposed.js', updated, 'utf8');
console.log('docx_engine_proposed.js created successfully.');
