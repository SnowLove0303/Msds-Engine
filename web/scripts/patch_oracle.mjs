import fs from 'fs';

const p = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/audit/legal-invariants-oracle.json';
const json = JSON.parse(fs.readFileSync(p, 'utf8'));

const invS8 = json.invariants.find(i => i.id === 'INV-S8-01');
if (invS8) {
  invS8.title = 'Section 8 控制参数与暴露控制法定层级及值排版规范';
  invS8.authority = 'GB/T 16483; GHS 规范; MSDS交付物全景产物审计体系规范文档.md §Section 8';
  invS8.historicalIncidents = ['9547 审计', 'EC-1804 审计', 'EP-1736 审计'];
  invS8.rule = '根据 GB/T 16483 及 GHS 标准规定：8.1 对应控制参数（职业接触限值 OEL 说明或实质性表格），8.2 对应暴露控制（工程控制与个人防护装备 PPE）。必须对齐源文件结构与法定层级；值文本排版严格遵循西文数字/单位（Times New Roman/Arial）、半角空格隔离（0.4 mm、480 min）、规范符号（≥ 严禁 ≧）与无孤立句点准则。';
  invS8.forbiddenAccusations = ['针对规范标准符号≥的诬告', '针对规范空格0.4 mm的诬告'];
}

const invS2 = json.invariants.find(i => i.id === 'INV-S2-01');
if (invS2) {
  invS2.title = '非危险品/未分类物质标签要素源事实忠实公理与缺省抑制';
  invS2.authority = 'OW-093; OW-094; GHS 标准; INV-ZERO-EXOGENOUS';
  invS2.historicalIncidents = ['EC-1804 审计', 'PU-202A 审计', 'EP-1736 审计'];
  invS2.rule = '当源文档未提及象形图或信号词时，输出严禁外生捏造“信号词：无”或“Signal word: None”，必须整行安全隐藏抑制；仅当源文件明文包含对应条目时方可输出。无象形图、无信号词属于法定正当表现，严禁防御性兜底填补伪数据。';
  invS2.forbiddenAccusations = ['源文件未提信号词未输出信号词属于遗漏', '非危险品缺少象形图属于瞒报', '未分类缺少危险说明属于遗漏'];
}

fs.writeFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/scripts/proposed_oracle.json', JSON.stringify(json, null, 2), 'utf8');
console.log('Proposed oracle written!');
