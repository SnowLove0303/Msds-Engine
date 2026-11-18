import fs from 'fs/promises';
import path from 'path';

async function listDir(dir) {
  const files = await fs.readdir(dir);
  for (const f of files) {
    console.log(path.join(dir, f));
  }
}

listDir('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/public/templates').catch(console.error);
