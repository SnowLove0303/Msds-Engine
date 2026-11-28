import fs from 'node:fs/promises';

async function restoreSmartMatching() {
  const file = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/scratch/smart-matching.proposed_s12.js';
  let content = await fs.readFile(file, 'utf8');
  content = content.replace(/\r\n/g, '\n');

  // Replace the inspectorRecords block
  const oldCode = `          const sourcePreambles = [];
          const s12SourceRecord = inspectorRecords?.find((r) => r.kind === 'table' && r.sectionNumber === 12);
          if (s12SourceRecord) {
            for (let rIdx = 1; rIdx < s12SourceRecord.rows.length; rIdx++) {
              const r = s12SourceRecord.rows[rIdx];
              const t = r.cells.map((c) => c.text || '').join('').trim();
              if (/生态毒性|持久性|12\\.\\d/i.test(t)) break;
              if (t) sourcePreambles.push(t);
            }
          }`;

  const newCode = `          const sourcePreambles = [];
          const ecoItemForPreambles = matchedSec.matchedRows.find((r) => r.key === 'ecotoxicity');
          if (ecoItemForPreambles?.logicalLines) {
            for (const line of ecoItemForPreambles.logicalLines) {
              const t = String(line || '').trim();
              if (/无可用的生态|未做任何试验|生态学研究/i.test(t)) {
                if (!sourcePreambles.includes(t)) sourcePreambles.push(t);
              } else if (/以下(?:是|为).*?生态毒理学/i.test(t)) {
                if (!sourcePreambles.includes(t)) sourcePreambles.push(t);
              }
            }
          }`;

  if (content.includes(oldCode)) {
    content = content.replace(oldCode, newCode);
  } else {
    console.error('Could not find oldCode in scratch file');
  }

  await fs.writeFile('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/scratch/smart-matching.restored_full.js', content, 'utf8');
  console.log('Restored full smart-matching to scratch/smart-matching.restored_full.js');
}
restoreSmartMatching();
