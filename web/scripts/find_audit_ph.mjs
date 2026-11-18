import fs from 'node:fs/promises';

async function search() {
  const content = await fs.readFile('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/scripts/run_master_msds_audit.mjs', 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    if (/\bpH\b/i.test(line)) {
      console.log(`${idx + 1}: ${line}`);
    }
  });
}

search();
