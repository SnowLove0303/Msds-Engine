import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const testDirs = [
  'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/tests/output_adaptive/test2_single_preset_bilingual',
  'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/tests/output_adaptive/test3_eight_deliverables'
];

console.log('Auditing PDF coordinates and Guocai entity text across all test deliverables...');

for (const d of testDirs) {
  if (!fs.existsSync(d)) continue;
  const files = fs.readdirSync(d);
  for (const f of files) {
    if (f.endsWith('.pdf')) {
      const fullPath = path.join(d, f);
      execSync(`python "F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/tests/verify_pdf_coords.py" "${fullPath}"`, { stdio: 'inherit' });
    }
  }
}

console.log('\nAll PDF deliverables physically verified with PyMuPDF!');
