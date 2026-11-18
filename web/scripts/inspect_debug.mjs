import { loadDocx } from '../src/docx-engine.js';

async function main() {
  const engine = await loadDocx('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料/2-1 单组份水性丙烯酸乳液 PA/PA-3653/PA-3653 MSDS（冠志）.docx');
  const parts = engine.inspectorRecords || engine.records || [];
  console.log(`Found ${parts.length} parts in engine.`);
  for (const p of parts) {
    console.log(`Sec ${p.sectionNumber} | kind: ${p.kind} | title: ${p.title} | rows: ${p.rows?.length || 0} | text: ${(p.text || '').slice(0, 50).replace(/\n/g, ' ')}`);
  }
}

main().catch(console.error);
