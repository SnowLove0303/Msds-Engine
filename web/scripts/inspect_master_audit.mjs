import fs from 'fs';

const lines = fs.readFileSync('web/scripts/run_master_msds_audit.mjs', 'utf8').split('\n');
lines.forEach((l, i) => {
  if (l.includes('sourceDocx') || l.includes('sourcePath') || l.includes('sourceFacts')) {
    console.log(`${i + 1}: ${l}`);
  }
});
