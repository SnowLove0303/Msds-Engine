import fs from 'fs';
import path from 'path';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html><body></body></html>');
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

import { recognizeSourceDocx, serializeFactsToMarkdown } from '../src/recognition-engine.js';

async function main() {
  const sourceDocxPath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料/2-4 水溶性丙烯酸树脂 PA/PA-4914/PA-4914 msds_CN 冠志.docx';
  const outJsonPath = 'C:/Users/Administrator/.gemini/antigravity/brain/f13d417c-b307-46d9-b5ab-f94d4cc0b83c/scratch/recognition_module_facts.json';
  const outMdPath = 'C:/Users/Administrator/.gemini/antigravity/brain/f13d417c-b307-46d9-b5ab-f94d4cc0b83c/scratch/recognition_module_facts.md';

  console.log(`>>> 启动标准识别模块 recognizeSourceDocx 处理: ${sourceDocxPath}`);
  const facts = await recognizeSourceDocx(sourceDocxPath);

  fs.writeFileSync(outJsonPath, JSON.stringify(facts, null, 2), 'utf8');
  console.log(`>>> 识别事实已写入 JSON: ${outJsonPath}`);

  const md = serializeFactsToMarkdown(facts);
  fs.writeFileSync(outMdPath, md, 'utf8');
  console.log(`>>> 识别事实 Markdown 已写入: ${outMdPath}`);
}

main().catch(err => {
  console.error('Recognition error:', err);
  process.exit(1);
});
