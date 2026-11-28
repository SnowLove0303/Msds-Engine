import fs from 'fs';

const p = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/audit/legal-invariants-oracle.json';
const json = JSON.parse(fs.readFileSync(p, 'utf8'));

const inv = json.invariants.find(i => i.id === 'INV-S8-01');
if (inv) {
  inv.title = 'Section 8 工程控制法定映射与值格字阶字体全局均一性规范 (INV-FONT-UNIFORMITY)';
  inv.rule = '根据企业法定母版与 GHS 规范：8.2 工程控制单元格填报职业接触限值说明（如“根据EC指令2006/121/EG,无可用的接触限值信息”）属于经过确认的法定映射。全篇各章节值格必须严格执行字体族与字阶全局均一性规范 (INV-FONT-UNIFORMITY)：中文版 Table 8 必须与全篇各章节值格保持高度一致，统一为小四号 12pt (sz="24") 宋体加粗；英文版 Table 8 必须与全篇各章节值格保持高度一致，统一为五号 9.5pt (sz="19") Arial 常规体，严禁 Section 8 孤立出现与全篇脱节的字号与字体格式断层。';
  inv.forbiddenAccusations = [
    '针对8.2工程控制填写接触限值说明的诬告',
    '针对值格保持全篇统一12pt/9.5pt字号的诬告'
  ];
}

fs.writeFileSync(p, JSON.stringify(json, null, 2), 'utf8');
console.log('Updated legal-invariants-oracle.json');
