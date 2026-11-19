import fs from 'node:fs';
import path from 'node:path';

const dir = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/scripts';
for (const f of fs.readdirSync(dir)) {
  if (!f.endsWith('.mjs') && !f.endsWith('.js')) continue;
  const p = path.join(dir, f);
  const text = fs.readFileSync(p, 'utf8');
  if (text.includes('expectedS11PreamblesCount') || text.includes('s11PreAudit') || text.includes('Section 11 说明行数量不匹配')) {
    console.log(f);
  }
}
