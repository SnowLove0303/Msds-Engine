import fs from 'node:fs';

const files = ['web/scripts/inspect_pa3654_gap.mjs', 'web/scripts/export_all_formats_cli.mjs', 'web/src/pipeline-engine.js'];
files.forEach(f => {
  if (fs.existsSync(f)) {
    const lines = fs.readFileSync(f, 'utf8').split('\n');
    lines.forEach((l, idx) => {
      if (l.includes('DOMParser') && idx < 50) {
        console.log(`${f}:${idx+1}: ${l}`);
      }
    });
  }
});
