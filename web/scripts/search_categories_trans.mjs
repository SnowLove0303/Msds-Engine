import fs from 'fs';
import path from 'path';

function searchInDir(dir) {
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) {
      if (f !== 'node_modules' && f !== '.git') searchInDir(full);
    } else if (f.endsWith('.js') || f.endsWith('.mjs')) {
      const code = fs.readFileSync(full, 'utf8');
      if (code.includes('急性毒性') && code.includes('Inhalation') || code.includes('Acute toxicity')) {
        console.log('Found in:', full);
      }
    }
  }
}

searchInDir('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src');
