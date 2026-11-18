import fs from 'fs';

const filePath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/scripts/run_master_msds_audit.mjs';
let code = fs.readFileSync(filePath, 'utf8');

const sIdx = code.indexOf('// 3. 中文第 0 列标签字号统一性断言 (REQ-02 / DEF-11)');
const eIdx = code.indexOf('// 4. 英文 Section 8 标签五号字号断言 (REQ-02 / DEF-12)', sIdx);

if (sIdx === -1 || eIdx === -1) {
  console.error('Target indices not found!');
  process.exit(1);
}

const replacement = `// 3. 中文第 0 列标签字号统一性断言 (REQ-02 / DEF-11 / REQ-GOLDEN-ANCHOR)
  // 遵循 9.1 外观黄金几何标尺：带序号标签由 10.5pt/9.5pt 序号 + 法定小四 12pt (sz="24") 标签构成；无序号标签统一为 12pt (sz="24")
  const docxCnRaw = await loadDocXml(path.join(targetDir, \`\${model} msds_CN 冠志.docx\`));
  const tblsCn = docxCnRaw.getElementsByTagName('w:tbl');
  let cnCell0HasNonStandardSz = false;
  let cnCell0Violation = '';
  for (let t = 0; t < tblsCn.length; t++) {
    const trs = tblsCn[t].getElementsByTagName('w:tr');
    for (let r = 1; r < trs.length; r++) {
      const c0 = trs[r].getElementsByTagName('w:tc')[0];
      if (!c0 || !c0.textContent.trim()) continue;
      const runs = Array.from(c0.getElementsByTagName('w:r'));
      for (const run of runs) {
        const runText = (run.textContent || '').trim();
        const hasTab = run.getElementsByTagName('w:tab').length > 0;
        const isSeqRun = hasTab || /^(\\d+\\.\\d+(?:\\.\\d+)?)\\s*$/.test(runText);
        const sz = run.getElementsByTagName('w:sz')[0];
        const szVal = sz ? sz.getAttribute('w:val') : null;
        if (!szVal) continue;
        if (isSeqRun) {
          if (szVal !== '21' && szVal !== '19' && szVal !== '20') {
            cnCell0HasNonStandardSz = true;
            cnCell0Violation = \`Tbl \${t+1} Row \${r+1} 序号 "\${runText}" 异常字号 sz="\${szVal}" (必须为 21/19)\`;
            break;
          }
        } else if (runText) {
          if (szVal !== '24') {
            cnCell0HasNonStandardSz = true;
            cnCell0Violation = \`Tbl \${t+1} Row \${r+1} 标签正文 "\${runText}" 异常字号 sz="\${szVal}" (必须为法定小四 24)\`;
            break;
          }
        }
      }
      if (cnCell0HasNonStandardSz) break;
    }
    if (cnCell0HasNonStandardSz) break;
  }
  assert(
    !cnCell0HasNonStandardSz,
    '环1',
    '中文标签第 0 列字阶均一性规范 (REQ-02 / DEF-11)',
    '中文表格第 0 列标签正文全量统一为法定小四 12pt (sz="24")，序号严格遵循 9.1 黄金标尺 10.5pt (sz="21") / 9.5pt (sz="19")',
    cnCell0HasNonStandardSz ? cnCell0Violation : '全量统一为 sz="24" (标签) / sz="21/19" (序号)',
    'MSDS CN Tables'
  );

  `;

code = code.substring(0, sIdx) + replacement + code.substring(eIdx);

fs.writeFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/scripts/audit_proposed_golden.js', code, 'utf8');
console.log('Successfully generated audit_proposed_golden.js!');
