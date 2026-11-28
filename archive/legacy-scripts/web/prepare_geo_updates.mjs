import fs from 'node:fs/promises';

async function updateSmartMatching() {
  const file = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/smart-matching.js';
  let content = await fs.readFile(file, 'utf8');
  content = content.replace(/\r\n/g, '\n');

  // 1. Add normalizeRowGeometry to import
  content = content.replace(
    'import {\n  W_NS,\n  removeCellFromRow,',
    'import {\n  W_NS,\n  removeCellFromRow,\n  normalizeRowGeometry,'
  );

  // 2. Call normalizeRowGeometry(repRow) explicitly
  const targetCode = `            if (repRow.cells.length > 2) {
              while (repRow.cells.length > 2) {
                removeCellFromRow(repRow, 1);
              }
            }`;

  const replacementCode = `            if (repRow.cells.length > 2) {
              while (repRow.cells.length > 2) {
                removeCellFromRow(repRow, 1);
              }
            }
            normalizeRowGeometry(repRow);`;

  content = content.replace(targetCode, replacementCode);

  await fs.writeFile('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/scratch/smart-matching.proposed_geo.js', content, 'utf8');
  console.log('Prepared scratch/smart-matching.proposed_geo.js');
}

async function updatePipelineEngine() {
  const file = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/pipeline-engine.js';
  let content = await fs.readFile(file, 'utf8');
  content = content.replace(/\r\n/g, '\n');

  // 1. Add normalizeRowGeometry to import
  content = content.replace(
    '  removeCellFromRow,',
    '  removeCellFromRow,\n  normalizeRowGeometry,'
  );

  // 2. Call normalizeRowGeometry(repRow) explicitly
  const targetCode = `        if (repRow && repRow.cells.length > 2) {
          while (repRow.cells.length > 2) {
            removeCellFromRow(repRow, 1);
          }
        }`;

  const replacementCode = `        if (repRow && repRow.cells.length > 2) {
          while (repRow.cells.length > 2) {
            removeCellFromRow(repRow, 1);
          }
          normalizeRowGeometry(repRow);
        }`;

  content = content.replace(targetCode, replacementCode);

  await fs.writeFile('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/scratch/pipeline-engine.proposed_geo.js', content, 'utf8');
  console.log('Prepared scratch/pipeline-engine.proposed_geo.js');
}

async function run() {
  await updateSmartMatching();
  await updatePipelineEngine();
}
run();
