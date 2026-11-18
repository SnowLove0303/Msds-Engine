import fs from 'fs';
import path from 'path';

function searchIn(dir, term) {
  for (const item of fs.readdirSync(dir)) {
    const full = path.join(dir, item);
    if (fs.statSync(full).isDirectory()) {
      if (item !== 'node_modules' && item !== '.git') searchIn(full, term);
    } else if (item.endsWith('.js') || item.endsWith('.mjs')) {
      const c = fs.readFileSync(full, 'utf8');
      if (c.includes(term)) {
        console.log(`Found "${term}" in ${full}`);
      }
    }
  }
}

searchIn('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src', '暴露控制');
searchIn('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src', '工程控制');
