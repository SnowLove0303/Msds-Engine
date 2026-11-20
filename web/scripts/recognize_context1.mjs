import fs from 'fs';
import path from 'path';
import { recognizeSourceDocx, serializeFactsToMarkdown } from '../src/recognition-engine.js';

async function main() {
  const args = process.argv.slice(2);
  const srcPath = args.find(a => !a.startsWith('--'));
  const outDirArg = args.find(a => a.startsWith('--out-dir='))?.split('=')[1];

  if (!srcPath) {
    console.error('用法: node web/scripts/recognize_context1.mjs <源文档.docx> [--out-dir=<输出目录>]');
    process.exit(1);
  }
  if (!fs.existsSync(srcPath)) {
    console.error(`源文件不存在: ${srcPath}`);
    process.exit(1);
  }

  const facts = await recognizeSourceDocx(srcPath, path.basename(srcPath));
  const model = facts.modelCode || path.basename(srcPath, path.extname(srcPath));
  const outDir = outDirArg || path.dirname(srcPath);
  fs.mkdirSync(outDir, { recursive: true });

  const jsonPath = path.join(outDir, `${model}_context1.json`);
  const mdPath = path.join(outDir, `${model}_context1.md`);

  const mdContent = [
    serializeFactsToMarkdown(facts),
    '\n## 物理无损自检指纹 (Physical Integrity)',
    `- 原始非空段落数: ${facts.integrity.rawParagraphCount}`,
    `- 原始字符数: ${facts.integrity.rawCharCount} | 提取字符数: ${facts.integrity.extractedCharCount} | 守恒率: ${facts.integrity.conservationRatio}%`,
    `- 章节覆盖: ${facts.integrity.coveredSectionsCount}/16 (空缺: ${facts.integrity.emptySections.length ? facts.integrity.emptySections.join(', ') : '无'})`,
    `- 未匹配原始段落数: ${facts.integrity.missingParagraphCount}`,
    `- 无损判定: ${facts.integrity.isLossless ? 'PASS (100% 无损)' : 'WARN (存在差异)'}`
  ].join('\n');

  fs.writeFileSync(jsonPath, JSON.stringify(facts, null, 2), 'utf8');
  fs.writeFileSync(mdPath, mdContent, 'utf8');

  console.log(`[Context 1 完成] 型号=${model} | 章节=${facts.integrity.coveredSectionsCount}/16 | 守恒率=${facts.integrity.conservationRatio}% | 缺失段落=${facts.integrity.missingParagraphCount}`);
  console.log(`  JSON: ${jsonPath}`);
  console.log(`  MD  : ${mdPath}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
