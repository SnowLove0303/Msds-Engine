import fs from 'fs';

const code = fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/scripts/run_master_msds_audit.mjs', 'utf8');
const sIdx = code.indexOf('// 3. 中文第 0 列标签字号统一性断言 (REQ-02 / DEF-11)');
const eIdx = code.indexOf('// 4. 英文 Section 8 标签五号字号断言 (REQ-02 / DEF-12)', sIdx);
console.log('sIdx:', sIdx, 'eIdx:', eIdx);
console.log(code.substring(sIdx, eIdx));
