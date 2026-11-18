import fs from 'fs';

const filePath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/pipeline-engine.js';
const proposedContent = fs.readFileSync(filePath, 'utf8');

const payload = {
  ServerName: 'vscode-review',
  ToolName: 'review_diff_in_vscode',
  Arguments: {
    filePath: filePath,
    proposedContent: proposedContent,
    description: 'Section 8 值格字阶与字体全局统一性规范 (INV-FONT-UNIFORMITY)：中文版统一为 12pt (sz="24") 宋体加粗，英文版统一为 9.5pt (sz="19") Arial 常规体，消除与全篇其他章节的字体大小与格式断层。'
  }
};

fs.writeFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/scripts/call_mcp_pipeline.json', JSON.stringify(payload, null, 2), 'utf8');
console.log('Payload written');
