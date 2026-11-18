import fs from 'node:fs/promises';

async function auditTranslations() {
  const content = await fs.readFile('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/scripts/bilingual_comparison_report.md', 'utf8');
  const sections = content.split('## Section ');

  for (let i = 1; i < sections.length; i++) {
    const secText = sections[i];
    const secNum = secText.split('\n')[0].split(' ')[0];
    console.log(`\n================ AUDITING SECTION ${secNum} ================`);
    
    // Check if EN cells contain any Chinese characters
    const enMatches = secText.match(/- \*\*EN:\*\*[\s\S]*?(?=(?:\*\*Cell|\n###|$))/g) || [];
    let chineseInEn = [];
    enMatches.forEach(en => {
      const cnChars = en.match(/[\u4e00-\u9fa5]/g);
      if (cnChars) {
        chineseInEn.push(en.slice(0, 100));
      }
    });

    if (chineseInEn.length > 0) {
      console.warn(`[WARNING] Found Chinese characters in English Section ${secNum}:`);
      chineseInEn.forEach(c => console.warn('  ', c));
    } else {
      console.log(`[PASS] Section ${secNum} has ZERO Chinese characters in English cells.`);
    }

    // Inspect translation fidelity
    // Print row summary
    const rows = secText.split('### Row ');
    console.log(`Section ${secNum} total rows: ${rows.length - 1}`);
  }
}

auditTranslations().catch(console.error);
