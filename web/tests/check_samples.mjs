import fs from 'node:fs';

const base = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料';
if (fs.existsSync(base)) {
  const dirs = fs.readdirSync(base);
  console.log('Available models in 算法训练材料:');
  for (const d of dirs.slice(0, 10)) {
    const sub = `${base}/${d}`;
    if (fs.statSync(sub).isDirectory()) {
      const files = fs.readdirSync(sub);
      console.log(`- ${d}: ${files.slice(0, 3).join(', ')}`);
    }
  }
}
