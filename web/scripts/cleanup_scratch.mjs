import fs from 'node:fs/promises';
import path from 'node:path';

const scratchDir = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/scripts';
const files = await fs.readdir(scratchDir);
for (const f of files) {
  if (f.startsWith('scratch_') || f.startsWith('test_s9_sz24')) {
    await fs.unlink(path.join(scratchDir, f));
    console.log(`Deleted temporary scratch file: ${f}`);
  }
}
