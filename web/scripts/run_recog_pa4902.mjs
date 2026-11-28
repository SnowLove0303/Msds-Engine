import fs from 'fs';
import path from 'path';
import { DOMParser, XMLSerializer } from '@xmldom/xmldom';

globalThis.DOMParser = DOMParser;
globalThis.XMLSerializer = XMLSerializer;

const { recognizeSourceDocx, serializeFactsToMarkdown } = await import('../src/msds-source-semantic-adapter.js');

async function main() {
  const sourceDocxPath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料/2-1 单组份水性丙烯酸乳液 PA/PA-4902/PA-4902msds_CN 冠志___源文件留存.docx';
  const outJsonPath = 'C:/Users/Administrator/.gemini/antigravity/brain/7f4d4b46-78e6-435a-aa29-f0d6ec194caa/scratch/PA-4902_recognition_facts.json';
  const outMdPath = 'C:/Users/Administrator/.gemini/antigravity/brain/7f4d4b46-78e6-435a-aa29-f0d6ec194caa/2026-11-19_PA-4902_MSDS源文件留存_标准识别模块事实报告.md';

  console.log(`>>> 启动识别模块处理: ${sourceDocxPath}`);
  const facts = await recognizeSourceDocx(sourceDocxPath);

  // Ensure scratch dir exists
  const scratchDir = path.dirname(outJsonPath);
  if (!fs.existsSync(scratchDir)) fs.mkdirSync(scratchDir, { recursive: true });

  fs.writeFileSync(outJsonPath, JSON.stringify(facts, null, 2), 'utf8');
  console.log(`>>> 识别事实已写入 JSON: ${outJsonPath}`);

  let md = '';
  if (typeof serializeFactsToMarkdown === 'function') {
    md = serializeFactsToMarkdown(facts);
  } else {
    md = '# PA-4902 MSDS 识别事实\n\n```json\n' + JSON.stringify(facts, null, 2) + '\n```\n';
  }

  fs.writeFileSync(outMdPath, md, 'utf8');
  console.log(`>>> 识别事实 Markdown 已写入: ${outMdPath}`);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
