import fs from 'node:fs';

let content = fs.readFileSync('../docs/MSDS_SPECIFICATIONS_COMPLETE_GUIDE.md', 'utf8');

// Update line 146
content = content.replace(
  '严格 6 空格（中文）/ 10 空格（英文），确保 `吸入`、`经口` 与 `经皮` 绝对垂直列对齐；',
  '严格 6 空格（中文）/ 14 空格（英文 Arial 9.5pt 下精准匹配 Toxicity: 3945 em 几何宽度），确保 `吸入`、`经口` 与 `经皮` 绝对垂直列对齐；'
);

// Add Section 2 English alignment rules
const oldS2Part = `  4. **第二节排版自动剪枝**：源文档中常见的“免责客套话”或多余的冗余说明段落，必须自动剪除，确保仅保留法定 GHS 分类条目。`;

const newS2Part = `  4. **第二节排版自动剪枝**：源文档中常见的“免责客套话”或多余的冗余说明段落，必须自动剪除，确保仅保留法定 GHS 分类条目。
  5. **英文版排版换行首字对齐与层级对齐公理 (English Section 2 First-Letter & Structural Alignment)**：
     - **标题与标题对齐**：防范说明四大子标题（\`Prevention:\`、\`Response:\`、\`Storage:\`、\`Disposal:\`）统一使用 \`left="480"\`，垂直严格对齐；
     - **内容与内容对齐**：各项防范说明内容使用 \`left="960"\`，垂直严格对齐；
     - **换行首字对齐**：成盐声明与具体规程段落统一使用无悬挂缩进（零 \`hanging\`），条目内换行时（如成盐第 2 行 \`concentration limit >= 5%\`），第 2 行首字直接与第 1 行首字母（\`N,N-...\` 之 \`N\`）垂直对齐，杜绝错位参差。`;

content = content.replace(oldS2Part, newS2Part);

fs.writeFileSync('scripts/proposed_guide.md', content);
console.log('Successfully wrote proposed_guide.md');
