import fs from 'node:fs/promises';

async function main() {
  const p = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/smart-matching.js';
  let content = await fs.readFile(p, 'utf-8');

  content = content.replace(
    /\!\/化学品名称\|CAS编号\|物质\/i\.test\(r\.cells\[0\]\.text\)/g,
    '!/化学品名称|CAS编号|物质|产品类型|成分|3\\.\\d/i.test(r.cells[0].text)'
  );
  content = content.replace(
    /(\.cells\?\.\[0\]\?\.text\?\.trim\(\))( \|\| '';)/g,
    '$1?.split(/\\r?\\n/)[0]?.trim()$2'
  );

  await fs.writeFile(p, content, 'utf-8');
  console.log('✅ Applied regex replacements in smart-matching.js');
}
main().catch(err => console.error(err));
