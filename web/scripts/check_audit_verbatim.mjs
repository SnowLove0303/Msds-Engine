import fs from 'node:fs/promises';

async function checkVerbatim() {
  const content = await fs.readFile('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/scripts/run_master_msds_audit.mjs', 'utf8');
  const m = content.match(/Section \$\{sNum\} 双语行数同构[\s\S]*?\n  \}/);
  if (m) {
    console.log('Found:\n', JSON.stringify(m[0]));
  } else {
    console.log('NOT FOUND');
  }
}
checkVerbatim().catch(console.error);
