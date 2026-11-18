import fs from 'fs';

const proposedContent = fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/scripts/proposed_docx_engine.js', 'utf8');

const args = {
  filePath: 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/docx-engine.js',
  proposedFilePath: 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/scripts/proposed_docx_engine.js',
  proposedContent,
  description: 'formatSection9LabelCell 中文与英文标签改用 <w:tab/> 锚定制表位，确保 Section 9 所有标签首字在同一绝对垂线对齐 (G-38)'
};

fs.writeFileSync('C:/Users/Administrator/.gemini/antigravity/brain/7f4d4b46-78e6-435a-aa29-f0d6ec194caa/vscode_diff_args.json', JSON.stringify(args), 'utf8');
console.log('Saved diff args json');
