import fs from 'node:fs/promises';

async function printSection(secNum) {
  const content = await fs.readFile('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/scripts/bilingual_comparison_report.md', 'utf8');
  const sections = content.split('## Section ');
  const targetSec = sections.find(s => s.startsWith(secNum + ' ') || s.startsWith(secNum + '\n'));
  if (targetSec) {
    console.log(`\n================ FULL TEXT FOR SECTION ${secNum} ================`);
    console.log(targetSec);
  }
}

async function run() {
  const sec = process.argv[2] || '1';
  await printSection(sec);
}

run().catch(console.error);
