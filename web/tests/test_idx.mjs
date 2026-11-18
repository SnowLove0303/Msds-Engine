import fs from 'node:fs';

const filePath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/scripts/audit_bipolar_bilayer.mjs';
let content = fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n');

const oldG04 = `  // G-04: 英文版零中文字符残留强门禁 (assertZeroChinese)
  let cnCountInGuanzhiEn = 0;
  const enTsGuanzhi = docEn.getElementsByTagName('w:t');
  for (let i = 0; i < enTsGuanzhi.length; i++) {
    const m = enTsGuanzhi[i].textContent.match(/[\\u4e00-\\u9fa5]/g);
    if (m) cnCountInGuanzhiEn += m.length;
  }
  assert(cnCountInGuanzhiEn === 0, \`英文版零中文强门禁 (Gate 4 冠志): 文本节点 <w:t> 中文字符数量为 0 (实测: \${cnCountInGuanzhiEn})\`);

  let cnCountInGuocaiEn = 0;
  const enTsGuocai = docGuocaiEn.getElementsByTagName('w:t');
  for (let i = 0; i < enTsGuocai.length; i++) {
    const m = enTsGuocai[i].textContent.match(/[\\u4e00-\\u9fa5]/g);
    if (m) cnCountInGuocaiEn += m.length;
  }
  assert(cnCountInGuocaiEn === 0, \`英文版零中文强门禁 (Gate 4 国彩): 文本节点 <w:t> 中文字符数量为 0 (实测: \${cnCountInGuocaiEn})\`);`;

console.log('Direct indexOf oldG04:', content.indexOf(oldG04));
